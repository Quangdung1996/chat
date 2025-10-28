using Ezy.APIService.Core.Services;
using Ezy.Module.Engine;
using SourceAPI.DataShared.Common;
using System.Net.Http;

namespace SourceAPI.Shared.Engines
{
    public class KeepServerAliveEngine : SourceEngineEntity
    {
        public override void DoJob(EngineQueueItem[] items)
        {
            string sAPIUrl = SystemConfigHelper.GetValueFromConfig(SystemConfigKeys.USER_AUTO_LOGIN_URL, "http://localhost:10001");
            sAPIUrl = sAPIUrl.TrimEnd('/');
            sAPIUrl += "/api/v1/GlobalAppSetting/KeepSessionAlive";
            using (var client = new HttpClient())
            {
                HttpResponseMessage erer = client.PostAsync(sAPIUrl, null).Result;
            }
        }

        public override bool IsNeedWriteLog()
        {
            return false;
        }
    }
}