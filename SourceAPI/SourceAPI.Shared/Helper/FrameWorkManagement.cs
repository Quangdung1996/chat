using Ezy.APIService.Core.DataInfo;
using Ezy.APIService.Core.Services;
using Ezy.APIService.EmailMessage.Data;
using Ezy.APIService.Shared.Services;
using Ezy.Module.BaseCache.CacheManager;
using Ezy.Module.BaseService.FrameWork;
using Ezy.Module.Library.Data;
using SourceAPI.Core.DataInfo.Cached;
using SourceAPI.DataShared.Common;
using SourceAPI.Shared.Helper;
using SourceAPI.Shared.Services;
using System;
using System.Linq;

namespace SourceAPI.Shared.Helper
{
    public class FrameWorkManagement : IEzyFrameWorkRegistrar
    {
        public void Register()
        {
            EzyFrameWorkManagement.RegisterAssemblyNames(new string[] { "SourceAPI.Core", "SourceAPI.Shared", "SourceAPI" });
            EzyFrameWorkManagement.RegisterFrameWork<ISQLFrameWork>();
            Register_Cache();
            AppScreenUIControlService screenService = new();
            screenService.Register_DynamicScreens();
           
        }

        public void Register_Cache()
        {
            EzyCachedDataManagement.RegisterCacheInfo<EmailTemplate, EmailTemplateInfo>((q) => { return q.OrderBy(c => c.Id); }, c => c.Id > 0);
            EzyCachedDataManagement.RegisterCacheInfo<EmailAccount, EmailAccountInfo>((q) => { return q.OrderBy(c => c.Id); }, c => c.Id > 0);
        }

        public static void  InitServiceWithSystemConfig()
        {
            #region FormatHelper

            Action actFormatInit = () =>
            {
                var keyFormat = SystemConfigHelper.GetValueFromConfig(SystemConfigKeys.System_Format_Culture, "{\"CultureName\":\"en-AU\",\"Pattern_Currency\":\"#,###\",\"Pattern_Number\":null,\"Pattern_LongDateTime\":null,\"Pattern_ShortDateTime\":null,\"Pattern_LongDate\":null,\"Pattern_ShortDate\":\"yyyy-MM-dd\",\"Pattern_LongTime\":null,\"Pattern_ShortTime\":null}");
                FormatHelper.InitCulture(keyFormat);
            };
            CachedDataManagement.SystemConfigs_Refresh_AddAction("FormatHelper", () =>
            {
                FormatHelper.RefreshCache();
                actFormatInit();
            });
            actFormatInit();

            #endregion FormatHelper
        }
    }
}