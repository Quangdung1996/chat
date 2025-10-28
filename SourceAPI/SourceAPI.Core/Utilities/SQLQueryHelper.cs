using System;
using System.Collections.Generic;
using System.Linq;

namespace SourceAPI.Core.Utilities
{
    public class SQLQueryHelper
    {
        #region GetDataWithArrayCondition

        /// <summary>
        /// //2100
        /// Thay vi lay T voi 100.000 Id -> SQL se bao loi
        /// Lay tu tu. moi lan lay thi lay ve 1000 record -> lay 100 lan
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="Ids"></param>
        /// <param name="fucnGetData"></param>
        /// <returns></returns>
        public static T[] GetDataWithArrayCondition<T, TKey>(TKey[] Ids, Func<TKey[], T[]> fucnGetData)
        {
            //10 phan tu, 1 trang 3 phan tu
            //4 trang

            //9 phan tu, 1 trang 3 phan tu
            //4 trang
            int numOfPage = 1000;
            int nPage = Ids.Length / numOfPage + (Ids.Length % numOfPage == 0 ? 0 : 1);
            List<T> listT = new List<T>();
            for (int i = 0; i < nPage; i++)
            {
                //lay trang i. numofPage = 3
                //trang 0: 0,1,2 -> lay tu 0 = 0*numOfPage -> skip 1
                //trang 1: 3,4,5 -> lay tu 3 = 1*numOfPage -> skip 3
                //trang 2: 6,7,8 -> lay tu 3 = 2*numOfPage -> skip 6
                var idsPage = Ids.Skip(i * numOfPage).Take(numOfPage).ToArray();
                var dataOnPage = fucnGetData(idsPage);
                listT.AddRange(dataOnPage);
            }
            return listT.ToArray();
        }

        #endregion GetDataWithArrayCondition
    }
}
