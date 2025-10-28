using Ezy.APIService.Core.DataInfo;
using Ezy.APIService.Shared.Engines;
using Ezy.APIService.SQLLogCore.SQLServices;
using Ezy.Module.BaseService.FrameWork;
using Ezy.Module.BaseService.Services;
using Ezy.Module.Engine;
using SourceAPI.Core.DataInfo.Cached;
using System;

namespace SourceAPI.Shared.Engines
{
    public class SourceEngineEntity : EzyEngineEntity
    {
        private SolidStaffInfo _CurrentUser = null;
        public SolidStaffInfo CurrentUser
        {
            get
            {
                if (_CurrentUser == null)
                {
                    _CurrentUser = CachedDataManagement.Userlogin_GetSystemUser();
                }
                return _CurrentUser;
            }
        }
        public TService CreateServiceInstance<TService>() where TService: IEzyBaseService
        {
            var user = CurrentUser;
            string sLogby = user == null ? "SystemEngine" : user.Username;
            var iService = EzyFrameWorkManagement.CreateInstance<TService>(sLogby);
            if (user != null)
            {
                iService.UserLoginId =  user.Id.ToString();
                iService.LogBy = sLogby;
            }
            return iService;
        }
        public override void Action_AfterDoJob()
        {
            
        }
        public void SaveLogException(Exception ex, string sMethod = "")
        {
            if (string.IsNullOrEmpty(sMethod))
            {
                sMethod = "DobJob";
            }
            SQLLogExceptionHelper.LogException(ex, "Engine_" + this.GetType().Name + sMethod, "");
        }
    }

    public class ReduceEngineHelper : CoreEngineEntity_Manager
    {
        private static bool isAutoStartEngine = false;
        public static void StartAllEngines(bool isAutoRun)
        {
            isAutoStartEngine = isAutoRun;
            KeepServerAliveEngine_Register();
            BatchJobEngine_Register();
        }
        private static void BatchJobEngine_Register()
        {
            var engine = new BatchJobEngine();
            RegisterEngine(engine, isAutoStartEngine);
        }
        private static void KeepServerAliveEngine_Register()
        {
            var engine = new KeepServerAliveEngine();
            RegisterEngine(engine, isAutoStartEngine);
        }
    }
}