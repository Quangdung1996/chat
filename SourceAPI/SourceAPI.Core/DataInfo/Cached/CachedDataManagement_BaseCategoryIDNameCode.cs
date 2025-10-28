using Ezy.Module.BaseData.Interfaces;
using SourceAPI.Core.Data;

namespace SourceAPI.Core.DataInfo.Cached
{
    public class BaseCategoryIDNameCodeInfo : IEzyIdAndNameEntity, IEzyCodeAndNameEntity
    {
        public long Id { get; set; }
        public virtual string Name { get; set; }
        public virtual string Code { get; set; }
        public bool IsDisable { get; set; }
    }
    public class JHLBaseCategoryIDNameCodeIconInfo : BaseCategoryIDNameCodeInfo, IEzyCodeAndName_IconEntity, IEzyIdAndName_IconEntity
    {
        public virtual string IconUrl { get; set; }
        public virtual string ColorCode { get; set; }
        public virtual string ColorCodeBG { get; set; }
    }
    public class JHLBaseCategoryInfo : BaseCategoryIDNameCodeInfo
    {
        public virtual decimal OrderNo { get; set; }
    }
    public class ChecklistBaseCategoryInfo : BaseCategoryIDNameCodeInfo
    {
        public virtual decimal OrderNo { get; set; }
    }

    public interface IRelatedToSoezyEntity
    {
        long? SoezyId { get; set; }
        string SoezyCode { get; set; }
    }
    public interface ICategoryToSoezyEntity : IEzyIdAndNameEntity, IEzyCodeAndNameEntity
    {
        long? SoezyId { get; set; }
        string SoezyCode { get; set; }
    }
}
