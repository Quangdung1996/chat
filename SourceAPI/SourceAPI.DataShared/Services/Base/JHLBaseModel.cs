using Ezy.Module.BaseData.Data;
using Ezy.Module.BaseData.Models;

namespace SourceAPI.DataShared.Services
{
  public  class SourceNoLogBaseModel: EzyBaseModel
    {
        [IgnorePermission(true)]
        [Newtonsoft.Json.JsonIgnore]
        public override int DocumentWidth { get => base.DocumentWidth; set => base.DocumentWidth = value; }
        [Newtonsoft.Json.JsonIgnore]
        public override string IM_CreatedBy { get => base.IM_CreatedBy; set => base.IM_CreatedBy = value; }
        [Newtonsoft.Json.JsonIgnore]
        public override double? IM_CreatedDate { get => base.IM_CreatedDate; set => base.IM_CreatedDate = value; }
        [Newtonsoft.Json.JsonIgnore]
        public override string IM_UpdatedBy { get => base.IM_UpdatedBy; set => base.IM_UpdatedBy = value; }
        [Newtonsoft.Json.JsonIgnore]
        public override double? IM_UpdatedDate { get => base.IM_UpdatedDate; set => base.IM_UpdatedDate = value; }
        [IgnorePermission(true)]
        [Newtonsoft.Json.JsonIgnore]
        public override double? UI_StartAt { get => base.UI_StartAt; set => base.UI_StartAt = value; }
        [IgnorePermission(true)]
        [Newtonsoft.Json.JsonIgnore]
        public override string Url { get => base.Url; set => base.Url = value; }
        [IgnorePermission(true)]
        [Newtonsoft.Json.JsonIgnore]
        public override int? UI_TimezoneOffset { get => base.UI_TimezoneOffset; set => base.UI_TimezoneOffset = value; }
        public virtual long? IM_ReturnTime { get; set; }
    }
}
