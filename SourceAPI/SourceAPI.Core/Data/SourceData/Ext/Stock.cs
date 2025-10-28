using Ezy.Module.BaseData.Interfaces;

namespace SourceAPI.Core.Data.SourceData
{
    public partial class Stock : IEFBaseEntity
    {
        public object GetId()
        {
            return Id;
        }
    }
}