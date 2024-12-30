
exports.todayMeal = async (req, res) => {
    function getFormattedDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(now.getDate()).padStart(2, '0');
      
        return `${year}${month}${day}`;
    }

    const date = getFormattedDate()

    try {
        const breakfast = await axios.get(`https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=R10&SD_SCHUL_CODE=8750767&KEY=&Type=json&MLSV_FROM_YMD=${date}&MLSV_TO_YMD=${date}&MMEAL_SC_CODE=1`)
        const lunch = await axios.get(`https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=R10&SD_SCHUL_CODE=8750767&KEY=&Type=json&MLSV_FROM_YMD=${date}&MLSV_TO_YMD=${date}&MMEAL_SC_CODE=2`)
        const dinner = await axios.get(`https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=R10&SD_SCHUL_CODE=8750767&KEY=&Type=json&MLSV_FROM_YMD=${date}&MLSV_TO_YMD=${date}&MMEAL_SC_CODE=3`)
    
        for (const meal of data) {
          const date = meal.MLSV_YMD;
          const dishes = meal.DDISH_NM.split('<br/>').map((dish) => dish.trim());
    
          for (const dish of dishes) {
            await prisma.meal.create({
              data: {
                date: new Date(date),
                dishName: dish,
              },
            });
          }
        }
    
        res.status(200).send('Data inserted successfully');
      } catch (error) {
        console.error(error);
        res.status(500).send('Error inserting data');
      }
}