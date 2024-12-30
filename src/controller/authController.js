const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client"); 
const prisma = new PrismaClient(); 

const JWT_SECRET_KEY = process.env.JWT_S_KEY; 
const JWT_REFRESH_KEY = process.env.JWT_R_KEY; 
const JWT_ACCESS_EXPIRATION = "1h"; 
const JWT_REFRESH_EXPIRATION = "7d"; 

exports.login = async (req, res) => {
  const { UserId, Password } = req.body;

  const user = await prisma.users.findUnique({
    where: { UserId },
  });

  if (!user) {
    return res.status(404).json({
      message: "회원정보를 찾을 수 없습니다.",
      status: "404",
    });
  }

  const isMatch = await bcrypt.compare(Password, user.Password);
  if (!isMatch) {
    return res.status(401).json({
      message: "비밀번호가 일치하지 않습니다.",
      status: "401",
    });
  }

  const accessToken = jwt.sign(
    { UserId: user.UserId, Name: user.Name }, 
    JWT_SECRET_KEY, 
    { expiresIn: JWT_ACCESS_EXPIRATION } 
  );

  const refreshToken = jwt.sign(
    { UserId: user.UserId, Name: user.Name }, 
    JWT_REFRESH_KEY, 
    { expiresIn: JWT_REFRESH_EXPIRATION } 
  );

  await prisma.users.update({
    where: { UserId: user.UserId },
    data: { refreshToken, accessToken },
  });

  return res.status(200).json({
    message: "로그인 성공",
    accessToken,
    refreshToken,
  });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: "리프레시 토큰이 제공되지 않았습니다.",
      status: "400",
    });
  }

  jwt.verify(refreshToken, JWT_REFRESH_KEY, async (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "유효하지 않은 리프레시 토큰입니다.",
        status: "403",
      });
    }

    const user = await prisma.users.findUnique({
      where: { UserId: decoded.UserId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        message: "리프레시 토큰이 일치하지 않습니다.",
        status: "403",
      });
    }

    const newAccessToken = jwt.sign(
      { UserId: user.UserId, Name: user.Name },
      JWT_SECRET_KEY,
      { expiresIn: JWT_ACCESS_EXPIRATION }
    );

    return res.status(200).json({
      message: "엑세스 토큰 갱신 성공",
      accessToken: newAccessToken,
    });
  });
};

exports.authenticate = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({
      message: "토큰이 제공되지 않았습니다.",
      status: "401",
    });
  }

  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "유효하지 않은 토큰입니다.",
        status: "403",
      });
    }

    req.user = decoded; 
    next();
  });
};

exports.register = async (req, res) => {
  const { UserId, Password, Name } = req.body;

  const existingUser = await prisma.users.findFirst({
    where: {
      UserId,
    },
  });

  if (existingUser) {
    return res.status(400).json({
      message: "이미 등록된 사용자입니다.",
      status: "400",
    });
  }

  const hashedPassword = await bcrypt.hash(Password, 10); 

  const newUser = await prisma.users.create({
    data: {
      UserId,
      Password: hashedPassword, 
      Name,
    },
  });

  return res.status(201).json({
    message: "회원가입 성공",
    user: {
      UserId,
      Name,
    },
  });
};

exports.logout = async (req, res) => {
    const { accessToken } = req.body;
  
    if (!accessToken) {
      return res.status(400).json({
        message: "accessToken이 누락되었습니다.",
        status: "400",
      });
    }
  
    try {
      const updatedUser = await prisma.users.updateMany({
        where: { accessToken },
        data: { accessToken: null },
      });
  
      if (updatedUser.count === 0) {
        return res.status(403).json({
          message: "올바르지 않은 accessToken입니다.",
          status: "403",
        });
      }
  
      res.status(200).json({
        message: "로그아웃이 정상적으로 완료되었습니다.",
        status: "200",
      });
    } catch (error) {
      console.error("로그아웃 처리 중 에러 발생:", error);
      res.status(500).json({
        message: "서버 내부 오류가 발생했습니다.",
        status: "500",
      });
    }
  };
  
