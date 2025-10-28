using Ezy.Module.BaseData.Models;
using Ezy.Module.Library.Data;

namespace SourceAPI.Shared.Models
{
    public class StockParamModel : EzyBaseParamModel
    {
    }
    public class StockModel : EzyBaseModel
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public int OrderNo { get; set; }
        public bool IsDisable { get; set; }
        public string Note { get; set; }
    }
    public class StockOptionsModel : BaseCategoryOptionModel
    {
        public BaseCategoryItem[] BranchList { get; set; } 
    }
}
