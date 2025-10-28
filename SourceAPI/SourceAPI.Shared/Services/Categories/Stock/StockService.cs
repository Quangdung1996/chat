//using Ezy.APIService.NotifyService.Helper;
using Ezy.Module.BaseService.FrameWork;
using Ezy.Module.Library.Data;
using SourceAPI.Core.Data.SourceData;
using SourceAPI.Core.DataInfo;
using SourceAPI.Core.DataInfo.Cached;
using SourceAPI.Shared.Models;
using System.Linq;

namespace SourceAPI.Shared.Services
{
    public class StockService : EFBaseCategoryService<Stock, StockModel, StockModel, StockParamModel, StockOptionsModel>, IStockService, ISQLFrameWork
    {
        public StockService()
        {
            InitService();
        }

        public StockService(string sLogBy)
        {
            InitService();
            LogBy = sLogBy;
        }

        private void InitService()
        {
            ScreenCode = CategoryScreenCodes.DM_STOCK;
            Func_ConvertToListModel = (e) => { return ConvertToModel(null, e); };
            func_BuildQuery = (p, q) =>
            {
                return q;
            };
            func_BuildQueryOrder = (q) =>
            {
                return q.OrderByDescending(t => t.OrderNo);
            };
        }
        public override Stock ConvertToEntity(Stock e, StockModel m)
        {
            e = base.ConvertToEntity(e, m);
            return e;
        }
        public override StockModel ConvertToModel(StockModel m, Stock e)
        {
            m = base.ConvertToModel(m, e);
            return m;
        }
        public override void SetOptionsValue(StockOptionsModel option, StockParamModel param)
        {
            //option.BranchList = UIDataHelper.GetListOptions_IdName(CachedDataManagement.Branchs);
        }
    }
}
