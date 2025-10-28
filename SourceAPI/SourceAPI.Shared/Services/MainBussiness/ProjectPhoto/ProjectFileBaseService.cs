using Ezy.APIService.Shared.Services;
using Ezy.Module.BaseData.Interfaces;
using SourceAPI.Core.Data;
using SourceAPI.Shared.Helper;

namespace SourceAPI.Shared.Services
{
    public class ProjectFileBaseService_V2<T, TFile, IPhotoService> : ProjectFileBaseService<T, TFile>
            where T : class, ISourceEntity, IProjectChild, new()
         where TFile : class, ISourceEntity, IEzyProject_File, new()
          where IPhotoService : IProjectPhotoService
    {
        public IEFBaseCategoryService<T> MainService { get; set; }

        public ProjectFileBaseService_V2(IEFBaseCategoryService<T> iService)
        {
            ScreenCode = iService.ScreenCode;
            LogBy = iService.LogBy;
            UserLoginId = iService.UserLoginId;
            MainService = iService;
            Func_GetFileParamModel = () =>
            {
                var param = new SQLFileParamModel();
                if (MainService != null && MainService.CurrentEntity != null)
                {
                    param.Id = SQLDataContextHelper.ConvertToStringId(MainService.CurrentEntity.Id);
                }
                if (MainService != null && MainService.iCurrentProjectId > 0)
                {
                    param.ProjectId = SQLDataContextHelper.GetProjectId_String(MainService.iCurrentProjectId);
                }
                return param;
            };
            RegisterPhotoService();
        }

        public void RegisterPhotoService()
        {
            EzyProjectPhotoServiveHepler.RegisterIPhotoService(ScreenCode, typeof(IPhotoService));
        }
    }

    public class ProjectFileBaseService<T, TFile> : EzyProjectFileBaseService<T, TFile>
          where T : class, ISourceEntity, IProjectChild, new()
        where TFile : class, ISourceEntity, IEzyProject_File, new()
    {
    }
}