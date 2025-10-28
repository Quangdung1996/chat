using Ezy.APIService.AppSystemAPI.Controllers;
using Ezy.APIService.AppSystemService.Models;
using Ezy.APIService.Core.DataInfo;
using Ezy.Module.Library.Message;
using Ezy.Module.Library.Utilities;
using Microsoft.AspNetCore.Mvc;
using SourceAPI.Core.DataInfo.Cached;
using System.Linq;

namespace SourceAPI.Controllers
{
    /// <summary>
    ///
    /// </summary>
    [Route("api/v1/GlobalAppSetting")]
    public class GlobalAppSettingController : EzyGlobalAppSettingController
    {
        public override EzyResultObject<AppSettingFisrtSettingModel> FisrtSetting(FisrtAppSettingParam model)
        {
            var rModel = base.FisrtSetting(model);
            var screens = CachedDataManagement.ConfigAppScreens.Where(c => c.IsPublicScreen() && c.IsDisable == false).ToArray();
            if (screens != null && screens.Length > 0)
            {
                rModel.Data.PublicApiScreenList = screens.Select(c => BuildScreen(c)).ToArray();
            }

            return rModel;
        }

        public override EzyResultObject<AppSettingFisrtSettingModel> FirstSetting(FisrtAppSettingParam model)
        {
            var rModel = base.FisrtSetting(model);
            var screens = CachedDataManagement.ConfigAppScreens.Where(c => c.IsPublicScreen() && c.IsDisable == false).ToArray();
            if (screens != null && screens.Length > 0)
            {
                rModel.Data.PublicApiScreenList = screens.Select(c => BuildScreen(c)).ToArray();
            }

            return rModel;
        }

        [NonAction]
        public BaseCategoryScreenConfigModel BuildScreen(ConfigAppScreenInfo c)
        {
            var m = new BaseCategoryScreenConfigModel()
            {
                Id = c.ID_GUID_Text,
                APIName = c.API_Url,
                ScreenCode = c.Code,
                UIUrl = c.ScreenPath,
                Title = c.Name,
                Type = c.Type,
                UIType = c.UIType,
                Config = c.ScreenConfig,
                RequestData = DictionaryHelper.ParseDic(c.RequestData ?? string.Empty, false)
            };
            return m;
        }
    }
}
