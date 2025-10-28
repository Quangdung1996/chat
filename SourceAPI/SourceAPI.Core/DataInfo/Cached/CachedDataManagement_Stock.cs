using System.Collections.Generic;
using System.Linq;

namespace SourceAPI.Core.DataInfo.Cached
{
    public partial class CachedDataManagement
    {
        #region Stocks

        //public static void Stocks_Refresh()
        //{
        //    RefreshCache<Stock>();
        //    //vi no xai o day SettingOption
        //}

        //public static StockInfo[] Stocks
        //{
        //    get
        //    {
        //        var data = GetAllDataFromDB_2<Stock, StockInfo>((q) => { return q.OrderBy(c => c.Id); }, c => c.Id > 0 && !c.IsDisable);
        //        return data;
        //    }
        //}

        //public static Dictionary<string, StockInfo> Stock_Dic
        //{
        //    get
        //    {
        //        var dic = GetDicId_Instance<string, StockInfo>(f => f.Id.ToString(), Stocks);
        //        return dic;
        //    }
        //}

        //public static StockInfo Stock_Get_Instance_Id(object sId)
        //{
        //    var item = Get_Instance_Id<StockInfo>(Stock_Dic, sId);
        //    return item;
        //}
        #endregion Stocks
    }
}
