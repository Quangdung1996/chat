using Ezy.APIService.AppSystemService.Helpers;
using Ezy.APIService.AppSystemService.Models;
using Ezy.Module.Controller.Controllers;
using Ezy.Module.Library.Message;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SourceAPI.Controllers
{
    /// <summary>
    ///
    /// </summary>
    [Route("api/v1/ProjectScreenHeader")]
    [Authorize]
    public class ProjectScreenHeaderController : BaseApiController
    {
        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("ProjectScreens")]
        public EzyResultObject<ProjectScreenConfigModel> GetProjectScreens(ProjectScreenConfigParamModel model)
        {
            var result = DoJob<ProjectScreenConfigModel>(model, null, (rs) =>
             {
                 // //Service_SetInfoFromController(this._service);
                 string sResult = "";
                 var _result = new ProjectScreenConfigModel();
                 _result = UserSettingHelper.GetURLConfigs(this.LogUserId);

                 rs.Msg = sResult;
                 return _result;
             });
            return result;
        }
    }
}
