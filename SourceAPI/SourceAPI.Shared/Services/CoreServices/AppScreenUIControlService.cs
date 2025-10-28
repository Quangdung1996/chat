using Ezy.APIService.AppSystemService.Models;
using Ezy.APIService.Core.Data;
using Ezy.APIService.Core.DataInfo;
using Ezy.APIService.Shared.Helper;
using Ezy.APIService.Shared.Models;
using Ezy.APIService.Shared.Services;
using Ezy.Module.BaseData.Models;
using Ezy.Module.Library.UI;
using Ezy.Module.Library.Utilities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace SourceAPI.Shared.Services
{
    public class AppScreenUIControlService : SQLEzyBaseService<EzyBaseIMEFEntity, ConfigScreenUIControlModel>
    {
        public void Register_DynamicScreens()
        {
            AppScreenUIControlHelper.Func_BuildScreenDefault = CreateUIPageConfigs_Dynamic;
        }

        public List<UIPageConfig> CreateUIPageConfigs_Dynamic(string sUIKey, AppScreenUIControlBuildFuncParam funcParam)
        {
            var param = funcParam.Param;
            var screen = funcParam.Screen;
            var uiParent = funcParam.UIParent;
            this.UserLoginId = funcParam.CurrentUser.Id.ToString();
            string sRequestData = string.Empty;
            Dictionary<string, object> dicRequestData = null;
            if (screen != null)
            {
                sRequestData = screen.RequestData;
                if (!string.IsNullOrEmpty(sRequestData))
                {
                    dicRequestData = DictionaryHelper.ParseDic(sRequestData);
                }
            }
            else if (uiParent != null && uiParent.RequestData != null)
            {
                sRequestData = JsonHelper.SerializeObject(uiParent.RequestData);
                dicRequestData = uiParent.RequestData;
            }
            List<UIPageConfig> listUIs = new();
            return listUIs;
        }
    }
}