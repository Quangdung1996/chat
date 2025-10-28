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
    [Route("api/v1/ConfigMenu")]
    [Authorize]
    public class ConfigMenuController : BaseApiController
    {
        /// <summary>
        ///
        /// </summary>
        public ConfigMenuController()
        {
        }

        /// <summary>
        ///
        /// </summary>
        /// <returns></returns>
        [Route("CategoryScreenList")]
        [HttpPost]
        public EzyResultObject<BaseCategoryScreenConfigModel[]> CategoryScreenList()
        {
            var result = DoJob<BaseCategoryScreenConfigModel[]>(null, null, (rs) =>
             {
                 var _model = BaseCategoryScreenConfigModel.Build(this.LogUserId);

                 return _model;
             });

            return result;
        }
    }
}
