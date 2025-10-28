using Ezy.Module.BaseData.Interfaces;

namespace SourceAPI.Core.Data
{
    public class DataContextRegistrar : ISQLDataContextRegistrar
    {
        public void Register()
        {
            //string sTypeSource = typeof(SourceEntities).Namespace;
            //EzyDbContextManager.FuncGetDbContext_Register(sTypeCategory, (isDevMode) =>
            //{
            //    return SourceDataContext.GetInstance(isDevMode);
            //});
        }
    }
}
