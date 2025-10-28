using Ezy.APIService.Shared.Helper;
using Ezy.APIService.Shared.Models;
using Ezy.APIService.Shared.Services;
using Ezy.Module.BaseData.Data;
using Ezy.Module.BaseService.FrameWork;
using Ezy.Module.Controller.Controllers;
using Ezy.Module.Library.Message;
using Ezy.Module.Media.Helper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace SourceAPI.Controllers
{
    /// <summary>
    ///
    /// </summary>
    [Authorize]
    [Route("api/v1/Upload")]
    public class UploadFileController : BaseUploadFileController
    {
        /// <summary>
        ///
        /// </summary>
        public override string UserFolderName
        {
            get
            {
                return "Users";
            }

            set
            {
                //base.UserFolderName = value;
            }
        }

        /// <summary>
        ///
        /// </summary>
        /// <returns></returns>
        [Route("User/MyAvatar")]
        [HttpPost]
        [MimeMultipart]
        public async Task<EzyResultObject<FileAvatarResponse>> UploadMyAvatar2()
        {
            return await base.UploadMyAvatar();
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Route("User/MyAvatar64")]
        [HttpPost]
        public EzyResultObject<FileAvatarResponse> UploadMyAvatarBase642(PictureUploadModel model)
        {
            return base.UploadMyAvatarBase64(model);
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Route("User/FBAvatar")]
        [HttpPost]
        public EzyResultObject<FileAvatarResponse> UploadFaceBookAvatar2(FacebookUserModel model)
        {
            return base.UploadFaceBookAvatar(model);
        }

        /// <summary>
        ///
        /// </summary>
        /// <returns></returns>
        [Route("User/MyAvatars")]
        [HttpGet]
        public EzyResultObject<string[]> GetAllAvatar2()
        {
            return base.GetAllAvatar();
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [Route("Project/Logo/{id}")]
        [HttpPost]
        [MimeMultipart]
        public async Task<EzyResultObject<string>> FileUploadProjectLogo(string id)
        {
            return await base.UploadProjectPicture(id, "Logo", "", SaveGProjectLogoToDB);
        }

        /// <summary>
        ///
        /// </summary>
        /// <returns></returns>
        [Route("Project/Photos")]
        [HttpPost]
        [MimeMultipart]
        public async Task<EzyResultObject<string[]>> FileUploadProject()
        {
            var model = GetParamFromHeader(this.Request);
            var folderPath = GetLocalFolderPath(model);
            var localFile = await UploadMultiFormData(folderPath);

            var result = new EzyResultObject<string[]>();
            result.Data = localFile;
            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="sUserId"></param>
        /// <param name="sSubPath"></param>
        /// <returns></returns>
        [NonAction]
        public override string SaveAvatarToDB(string sUserId, string sSubPath)
        {
            var sFieldId = sSubPath;
            var param = new UploadPhotoModel()
            {
                ScreenCode = "StaffAvatar",
                ProjectId = sUserId,
                FieldName = "",
                Files = new SystemFileItem[] { new SystemFileItem() { FullPath = EzyPictureHelper.GetFullPath_Server(sSubPath) } }
            };
            var _userManager = EzyFrameWorkManagement.CreateInstance<IAccountService>("");
            var result = EzyPictureHelper.UploadToGoogleDrive(param);
            if (result != null && result.Files != null && result.Files.Length > 0)
            {
                sFieldId = result.Files.FirstOrDefault().FileId;
                _userManager.SaveProfilePicturePath(sUserId, sFieldId);
                return EzyPictureHelper.GetFullUrlThumbnail(sFieldId, "");
            }
            else
            {
                _userManager.SaveProfilePicturePath(sUserId, sSubPath);
                return EzyPictureHelper.GetFullUrl_Server(sSubPath);
            }
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="sProjectId"></param>
        /// <param name="sSubPath"></param>
        /// <returns></returns>
        [NonAction]
        public string SaveGProjectLogoToDB(string sProjectId, string sSubPath)
        {
            string sFullPath = EzyPictureHelper.GetFullPath_Server(sSubPath);
            return string.Empty;

            //UploadPhotoModel model = new UploadPhotoModel()
            //{
            //    ProjectId = sProjectId,
            //    ScreenCode = "Logo",
            //    Files = new SystemFileItem[] { new SystemFileItem()
            //    { FullPath = sFullPath } }
            //};

            //var result = EzyPictureHelper.UploadToGoogleDrive(model);
            //string sLogoPath = sSubPath;
            //if (result != null && result.Files != null && result.Files.Length > 0)
            //{
            //    sLogoPath = result.Files[0].FileId;
            //}
            //var sbackground = EzyPictureHelper.GetBackgroundColor(sFullPath);
            //var _userManager = EzyFrameWorkManagement.CreateInstance<IProjectScreenHeaderService>(LogUser);
            //ProjectLogoModel modelLogo = new ProjectLogoModel() { ProjectId = sProjectId, LogoPath = sLogoPath, LogoBackground = sbackground };
            //_userManager.UploadLogo(modelLogo);

            //return SolidPictureHelper.GetFullUrlThumbnail(sLogoPath, "");
        }

        [NonAction]
        private UploadPhotoModel GetParamFromHeader(HttpRequest request)
        {
            UploadPhotoModel model = new UploadPhotoModel();
            var headers = request.Headers;
            var pr = GetHeaderValues(headers, "ProjectId");
            if (pr != null)
            {
                model.ProjectId = pr.FirstOrDefault();
            }
            var sc = GetHeaderValues(headers, "ScreenCode");
            if (sc != null)
            {
                model.ScreenCode = sc.FirstOrDefault();
            }
            var field = GetHeaderValues(headers, "FieldName");
            if (field != null)
            {
                model.FieldName = field.FirstOrDefault();
            }
            var id = GetHeaderValues(headers, "Id");
            if (id != null)
            {
                model.Id = id.FirstOrDefault();
            }
            return model;
        }

        ///// <summary>
        /////
        ///// </summary>
        ///// <param name="headers"></param>
        ///// <param name="sKey"></param>
        ///// <returns></returns>
        //[NonAction]
        //public string[] GetHeaderValues(IHeaderDictionary headers, string sKey)
        //{
        //    string[] result = null;
        //    if (headers.ContainsKey(sKey))
        //    {
        //        var values = headers[sKey];
        //        if (values != (string)null && values.Count() > 0)
        //        {
        //            result = values.ToArray();
        //        }
        //    }
        //    return result;
        //}

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [NonAction]
        public string GetLocalFolderPath(UploadPhotoModel model)
        {
            string sResult = "";
            sResult = EzyPictureHelper.GetFolderPath_Server(model);
            return sResult;
        }
    }
}
