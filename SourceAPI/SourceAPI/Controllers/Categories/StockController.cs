using Ezy.APIService.SharedController.Controllers;
using Ezy.Module.Library.Message;
using Ezy.Module.Library.UI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SourceAPI.Shared.Models;
using SourceAPI.Shared.Services;

namespace SourceAPI.Controllers
{
    [Route("api/v1/Stock")]
    [Authorize]
    public class StockController : EzyBaseCategoryController<IStockService, StockModel, StockModel, StockParamModel, StockOptionsModel>
    {
        [Route("List")]
        [HttpPost]
        public EzyResultObject<EzyDataSourceResult<StockModel>> List(StockParamModel model)
        {
            return base.List_Simple(model);
        }
    }
}
