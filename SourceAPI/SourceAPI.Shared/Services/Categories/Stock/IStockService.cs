using Ezy.APIService.Shared.Services.CoreService;
using SourceAPI.Shared.Models;

namespace SourceAPI.Shared.Services
{
    public interface IStockService : IEzyCategoryService<StockModel, StockModel, StockParamModel, StockOptionsModel>
    {

    }
}
