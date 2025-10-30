using Ezy.APIService.AppSystemService.Models;
using Ezy.APIService.AppSystemService.Services;
using Ezy.APIService.Core.Data;
using Ezy.APIService.Core.Services;
using Ezy.APIService.Shared.Models;
using Ezy.APIService.Shared.Services;
using Ezy.Module.BaseMSSQLData.Utilities;
using Ezy.Module.BaseService.FrameWork;
using Ezy.Module.Controller.Controllers;
using Ezy.Module.Library.Message;
using Ezy.Module.Library.UI;
using Ezy.Module.Library.Utilities;
using Microsoft.AspNet.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using SourceAPI.DataShared.Common;
using SourceAPI.Services.BackgroundQueue;
using SourceAPI.Services.RocketChat;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.Controllers
{
    /// <summary>
    ///
    /// </summary>
    [Route("api/v1/Account")]
    public class AccountController : BaseEzyServiceController<IAccountService>
    {
        private const string TwitterApiBaseUrl = "https://api.twitter.com/1.1/";

        private DateTime epochUtc = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        private readonly IBackgroundTaskQueue _backgroundTaskQueue;
        private readonly IRocketChatUserService _rocketChatUserService;

        public AccountController(
            IBackgroundTaskQueue backgroundTaskQueue,
            IRocketChatUserService rocketChatUserService)
        {
            _backgroundTaskQueue = backgroundTaskQueue;
            _rocketChatUserService = rocketChatUserService;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        [Route("login")]
        public async Task<HttpResponseMessage> LoginUser(UserLoginModel model)
        {
            HttpResponseMessage responseMsg = null;
            string tokenServiceUrl = "";
            try
            {
                string sUrl = "http://localhost:12391";// "http://localhost:11001"
                tokenServiceUrl = SystemConfigHelper.GetValueFromConfig(EzySystemConfigKeys.USER_AUTO_LOGIN_URL, sUrl);
                tokenServiceUrl += "/oauth2/token";
                using (var client = new HttpClient())
                {
                    var requestParams = new List<KeyValuePair<string, string>>
            {
                new KeyValuePair<string, string>("grant_type", "password"),
                new KeyValuePair<string, string>("username", model.Username),
                new KeyValuePair<string, string>("password", model.Password),
                 new KeyValuePair<string, string>("device_number", model.DeviceNumber),
                  new KeyValuePair<string, string>("app_name", model.AppName)
            };
                    var requestParamsFormUrlEncoded = new FormUrlEncodedContent(requestParams);
                    var tokenServiceResponse = await client.PostAsync(tokenServiceUrl, requestParamsFormUrlEncoded);
                    var responseString = await tokenServiceResponse.Content.ReadAsStringAsync();
                    var responseCode = tokenServiceResponse.StatusCode;
                    responseMsg = new HttpResponseMessage(responseCode)
                    {
                        Content = new StringContent(responseString, Encoding.UTF8, "application/json")
                    };
                }
            }
            catch (Exception ex)
            {
                Log_Exception(ex, "LoginUser", tokenServiceUrl);

                responseMsg = new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError);
                string sError = EzyExceptionHelper.GetMessage(ex);
                if (ex.InnerException != null)
                {
                    sError += " - " + ex.InnerException.Message;
                }
                responseMsg.ReasonPhrase = sError;
            }
            return responseMsg;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <param name="sAccess"></param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        public HttpResponseMessage GetFaceBookAvatar(SocialUserLoginModel model, string sAccess)
        {
            try
            {
                string tokenServiceUrl = "http://localhost:10001";// SystemConfigHelper.GetValueFromConfig(SystemConfigKeys.USER_AUTO_LOGIN_URL, "http://localhost:10001");
                tokenServiceUrl += "/api/v1/Upload/User/FBAvatar";

                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + sAccess);
                    FacebookUserModel data = new FacebookUserModel { Id = model.UserLoginId, FaceId = model.SocialUserId };
                    StringContent contents = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(data), Encoding.UTF8, "application/json");
                    var tokenServiceResponse = client.PostAsync(tokenServiceUrl, contents).Result;
                    var responseString = tokenServiceResponse.Content.ReadAsStringAsync().Result;
                    var responseCode = tokenServiceResponse.StatusCode;
                    var responseMsg = new HttpResponseMessage(responseCode)
                    {
                        Content = new StringContent(responseString, Encoding.UTF8, "application/json")
                    };
                    return responseMsg;
                }
            }
            catch (Exception ex)
            {
                Log_Exception(ex, "GetFaceBookAvatar", sAccess);
                return new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]

        // POST api/Account/Logout
        [Route("Logout")]
        [Authorize]
        public EzyResultObject<string> Logout(LogOutModel model)
        {
            var result = DoJob<string>(model, null, (rs) =>
             {
                 var sUserId = this.LogUserId;
                 var sResult = _service.LogOut(sUserId, model);

                 rs.Msg = sResult;

                 return sResult;
             }, "Logout successful.");

            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("UserInfo")]
        [Authorize]
        public EzyResultObject<UserProfileInfo> UserInfo()
        {
            var result = DoJob<UserProfileInfo>(null, null, (rs) =>
             {
                 var sUserId = this.LogUserId;
                 var userInfo = _service.GetUserInfo(sUserId);
                 if (userInfo != null)
                 {
                 }
                 else
                 {
                     rs.Msg = "Can not find user info";
                 }
                 return userInfo;
             });
            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("UserInfo")]
        [Authorize]
        public EzyResultObject<UserProfileInfo> UserInfo(UserProfileInfo model)
        {
            string sUserId = User.Identity.GetUserId();
            model.Id = sUserId;

            var result = DoJob<UserProfileInfo>(model, null, (rs) =>
             {
                 string sMessage = "";
                 var _model = _service.UpdateUserInfo(model, out sMessage);
                 if (!string.IsNullOrEmpty(sMessage))
                 {
                     rs.Msg = sMessage;
                 }

                 return _model;
             }, Message_UpdateSuccess);
            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [Authorize]
        [HttpPost]
        [Route("ChangePassword")]
        public EzyResultObject<string> ChangePassword(UserChangePassModel model)
        {
            model.Id = User.Identity.GetUserId();

            var result = DoJob<string>(model, null, (rs) =>
             {
                 string sResult = "";

                 if (string.IsNullOrEmpty(sResult))
                 {
                     sResult = _service.ChangePassword(model);
                 }

                 if (!string.IsNullOrEmpty(sResult))
                 {
                     rs.Msg = sResult;
                 }
                 return sResult;
             }, Message_UpdateSuccess);

            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("Register")]
        public async Task<EzyResultObject<OAuthTokenResponse>> Register(UserRegisterModel model)
        {
            EzyResultObject<OAuthTokenResponse> result = new EzyResultObject<OAuthTokenResponse>() { StatusCode = (int)EzyResultCode.Error, Data = null };
            string sResult = "";
            try
            {
                // de log lai api request ham dang ky
                var mResult = DoJob<string>(model, null, rs =>
                {
                    string sMessage = string.Empty;
                    sMessage = _service.Register(model);
                    rs.Msg = sMessage;
                    return sMessage;
                }, "");
                if (mResult != null)
                {
                    if (!string.IsNullOrEmpty(mResult.Msg))
                    {
                        sResult = mResult.Msg;
                    }
                    else if (mResult.Data != null)
                    {
                        sResult = mResult.Data.ToString();
                    }
                }
                if (string.IsNullOrEmpty(sResult))
                {
                    bool isAutoLogin = true;// SystemConfigHelper.GetValueFromConfig(SystemConfigKeys.USER_LOGIN_AFTER_REGISTER, "1") == "1";
                    if (isAutoLogin == true)
                    {
                        try
                        {
                            var loginResult = this.LoginUser(new UserLoginModel()
                            {
                                Username = model.Username,
                                Password = model.Password,
                                AppName = model.AppName,
                                DeviceNumber = model.DeviceNumber
                            });
                            HttpResponseMessage loginResponse = await loginResult;
                            OAuthTokenResponse token = Newtonsoft.Json.JsonConvert.DeserializeObject<OAuthTokenResponse>(loginResponse.Content.ReadAsStringAsync().Result);

                            result.Data = token;
                            Register_SaveMoreInfo(model, token);

                            // Queue background task to sync Rocket.Chat user
                            await QueueRocketChatUserSync(token.user_id, model.Username, $"{model.FirstName} {model.LastName}", model.Email);
                        }
                        catch (Exception exLogin)
                        {
                            sResult = "Register Successful, but can not login. Please login again";
                            Log_Exception(exLogin, "Register-LoginUser", JsonHelper.SerializeObject(model));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                sResult = Message_GeneralError;
                Log_Exception(ex, "Register", JsonHelper.SerializeObject(model));
            }
            if (string.IsNullOrEmpty(sResult))
            {
                result.StatusCode = (int)EzyResultCode.Success;
                result.Msg = Message_LoginSuccess;
            }
            else
            {
                result.Msg = sResult;
            }
            return result;
        }

        private void Register_SaveMoreInfo(UserRegisterModel model, OAuthTokenResponse token)
        {
            string sMessage = string.Empty;
            if (model != null && token != null)
            {
                //var service = EzyFrameWorkManagement.CreateInstance<IEzyCategoryService>("");
                //service.UserLoginId = token.user_id;
                //service.LogBy = token.user_name;
                //service.SaveRegisterInfo4UserLogin(model, out sMessage);
            }
        }

        /// <summary>
        /// Queue background task to sync newly registered user to Rocket.Chat
        /// </summary>
        private async Task QueueRocketChatUserSync(string userId, string username, string fullName, string email)
        {
            try
            {
                await _backgroundTaskQueue.QueueBackgroundWorkItemAsync(async token =>
                {
                    try
                    {
                        var syncResult = await _rocketChatUserService.SyncUserAsync(
                            int.Parse(userId),
                            username,
                            fullName ?? username,
                            email
                        );

                    }
                    catch (Exception ex)
                    {

                    }
                });


            }
            catch (Exception ex)
            {

            }
        }

        [NonAction]
        private string CheckValidRegister(UserRegisterModel model, string sFieldNameKey)
        {
            string sMgs = "";
            if (sFieldNameKey.Contains("EmailOrPhone"))
            {
                if (string.IsNullOrEmpty(model.Email) && string.IsNullOrEmpty(model.PhoneNumber))
                {
                    sMgs = "Please enter your email or phone number";
                }
            }
            else if (sFieldNameKey.Contains("Phone"))
            {
                if (string.IsNullOrEmpty(model.PhoneNumber))
                {
                    sMgs = "Please enter your phone number";
                }
            }
            else if (sFieldNameKey.Contains("Email"))
            {
                if (string.IsNullOrEmpty(model.Email))
                {
                    sMgs = "Please enter your Email";
                }
            }
            else
            {
                if (string.IsNullOrEmpty(model.Username))
                {
                    sMgs = "Please enter your Username";
                }
            }
            return sMgs;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("ForgotPassword")]
        public EzyResultObject<UserPasswordRecoveryModel> ForgotPassword(UserForgotPassModel model)
        {
            string sDoJobSuccess = SystemText_GetValue("msg_forgotpassword_success", "Please see information in your email to reset password"); ;
            var result = DoJob<UserPasswordRecoveryModel>(model, () =>
             {
                 string sResult = "";
                 if (model == null || string.IsNullOrEmpty(model.Email))
                     sResult = "Please provide your email address";
                 return sResult;
             }, (rs) =>
             {
                 UserPasswordRecoveryModel recoModel = null;
                 string sResult = "";
                 var user = _service.GetUserForgotPassword(model.Email);
                 if (user != null)
                 {
                     var token = Guid.NewGuid().ToString();
                     recoModel = new UserPasswordRecoveryModel
                     {
                         Email = user.EmailAddress,
                         ExpriedDate = DateTime.UtcNow.AddMinutes(120),
                         PasswordRecoveryURL = token,
                         //UserId = user.Id,
                         //FirstName = user.FirstName
                     };
                     //if (string.IsNullOrEmpty(recoModel.FirstName))
                     //{
                     //    recoModel.FirstName = user.Username;
                     //}
                     string sInsertResult = _service.InsertPasswordRecovery(user, recoModel);
                     if (string.IsNullOrEmpty(sInsertResult))
                     {
                         string sUrl = SystemConfigHelper.GetValueFromConfig(EzySystemConfigKeys.USER_PASSWORD_RECOVERY_URL, "https://dev.solidapp.vn/#/reset_password");
                         if (sUrl != null)
                         {
                             sUrl = sUrl + token;
                         }

                         recoModel.PasswordRecoveryURL = sUrl;

                         IEzyEmailMessageQueueService emailService = EzyFrameWorkManagement.CreateInstance<IEzyEmailMessageQueueService>("");
                         sInsertResult = emailService.InsertMessageQueueByTemplate<UserPasswordRecoveryModel>(EmailTemplateKeys.USER_FORGOT_PASSWORD, recoModel, null);
                     }
                     sResult = sInsertResult;
                     if (!string.IsNullOrEmpty(sResult))
                     {
                         recoModel = new UserPasswordRecoveryModel();
                     }
                 }
                 else
                 {
                     sResult = SystemText_GetValue("msg_forgotpassword_usernotfound", "Sorry, no account was found in our system with the email address as you typed it");
                 }
                 if (!string.IsNullOrEmpty(sResult))
                 {
                     rs.Msg = sResult;
                 }

                 return recoModel;
             }, sDoJobSuccess);

            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("ResetPassword")]
        public EzyResultObject<string> PasswordRecovery(PasswordRecoveryModel model)
        {
            string sDoJobSuccess = SystemText_GetValue("msg_resetpassword_success", "Your password has been reset. Please log in again.");
            var result = DoJob<string>(model, null, (rs) =>
             {
                 string sResult = "";

                 if (string.IsNullOrEmpty(sResult))
                 {
                     sResult = _service.PasswordRecovery(model);
                 }

                 if (!string.IsNullOrEmpty(sResult))
                 {
                     rs.Msg = sResult;
                 }

                 return sResult;
             }, sDoJobSuccess);
            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("ValidateToken")]
        public EzyResultObject<ValidationToken> ValidatePasswordToken(PasswordRecoveryModel model)
        {
            var result = DoJob<ValidationToken>(model, null, (rs) =>
             {
                 var data = _service.CheckValidPassworKey(model.PasswordKey);
                 return data;
             });
            return result;
        }

        #region ExternalLogin OLd

        //[HttpPost]
        //[Route("ExternalLogin")]
        //public async Task<EzyResultObject<OAuthTokenResponse>> ExternalLogin(UserLoginSocialModel model)
        //{
        //    EzyResultObject<OAuthTokenResponse> result = new EzyResultObject<OAuthTokenResponse>() { StatusCode = (int)EzyResultCode.Error, Data = null };
        //    string sResult = "";
        //    try
        //    {
        //        if (!ModelState.IsValid)
        //        {
        //            //return BadRequest(ModelState);
        //            sResult = "BadRequest";

        //        }
        //        // SocialUserInfo socialUser = await GetExternalUserInfo(model.SocialId, model.SocialToken, model.SocialUserId);
        //        SocialUserLoginModel loginModel = null;
        //        if (string.IsNullOrEmpty(sResult))
        //        {
        //            loginModel = _service.Register_Social(model, out sResult);
        //        }
        //        if (string.IsNullOrEmpty(sResult) && loginModel != null)
        //        {
        //            try
        //            {
        //                var verityToken = await VerifyExternalAccessToken(model.SocialId, model.SocialToken, model.SocialUserId);
        //                if (verityToken != null)
        //                {
        //                    var loginResult = this.LoginUser(new UserLoginModel()
        //                    {
        //                        Username = loginModel.UserLoginId,
        //                        Password = SecurityHelper.SOCIAL_PASSWORD_PREFIX + "_" + model.SocialUserId,
        //                        AppName = model.AppName,
        //                        DeviceNumber = model.DeviceNumber
        //                    });
        //                    HttpResponseMessage loginResponse = await loginResult;
        //                    var sContent = loginResponse.Content.ReadAsStringAsync().Result;
        //                    OAuthTokenResponse token = Newtonsoft.Json.JsonConvert.DeserializeObject<OAuthTokenResponse>(sContent);
        //                    result.Data = token;

        //                    if (loginModel.IsNeedGetAvatar == true && model.SocialId == "facebook")
        //                    {
        //                        GetFaceBookAvatar(loginModel, token.access_token);
        //                    }
        //                }
        //                else
        //                {
        //                    sResult = "Your social account is not valid. Please try again.";
        //                }

        //            }
        //            catch (Exception exLogin)
        //            {
        //                sResult = "Sorry, can not login. Please try again";
        //                ILogExceptionService logEx = KatchaFrameWorkManagement.CreateInstance<ILogExceptionService>(LogUser);
        //                logEx.SaveException(exLogin, "ExternalLogin-Login", "");
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        sResult = "Have some error";// ExceptionHelper.GetMessageFromException(ex);
        //        ILogExceptionService logEx = KatchaFrameWorkManagement.CreateInstance<ILogExceptionService>(LogUser);
        //        logEx.SaveException(ex, "Register", "");
        //    }
        //    if (string.IsNullOrEmpty(sResult))
        //    {
        //        result.StatusCode = (int)EzyResultCode.Success;
        //        result.Msg = "Welcome to Katcha";
        //    }
        //    else
        //    {
        //        result.Msg = sResult;
        //    }
        //    return result;
        //}

        #endregion ExternalLogin OLd

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("SocialLogin")]
        public async Task<EzyResultObject<LoginSocialModel>> SocialLogin(UserLoginSocialModel model)
        {
            EzyResultObject<LoginSocialModel> result = new EzyResultObject<LoginSocialModel>() { StatusCode = (int)EzyResultCode.Error, Data = null };
            string sResult = "";
            try
            {
                LoginSocialModel data = new LoginSocialModel() { SocialInfo = model, Token = new OAuthTokenResponse() { access_token = "" } };
                //SocialUserInfo socialUser = await GetExternalUserInfo(model.SocialId, model.SocialToken, model.SocialUserId, model.SocialTokenSecret);
                //if (socialUser == null || string.IsNullOrEmpty(socialUser.id))
                //{
                //    sResult = SystemText_GetValue("msg_sociallogin_invalidsocialaccount", "Your Social account is invalid. Please try again");
                //    // sResult = string.Format("Tài khoản {0} của bạn không có quyền đăng nhập. Vui lòng thử lại", model.SocialId);
                //    if (!string.IsNullOrEmpty(sResult))
                //        sResult = sResult.Replace("[SocialId]", model.SocialId);
                //}
                //else
                //{
                //    SocialUserLoginModel loginModel = null;
                //    model.SocialEmail = socialUser.email;
                //    model.SocialUserId = socialUser.id;
                //    model.SocialDisplay = socialUser.name;
                //    model.SocialUrlId = socialUser.screen_name;
                //    model.SocialAvatar = socialUser.picture;
                //    if (!string.IsNullOrEmpty(socialUser.user_name) && string.IsNullOrEmpty(model.SocialUsername))
                //    {
                //        model.SocialUsername = socialUser.user_name;
                //    }
                //    if (!string.IsNullOrEmpty(socialUser.app_name))
                //    {
                //        model.AppName = socialUser.app_name;
                //    }
                //    data.SocialInfo = model;
                //    if (string.IsNullOrEmpty(sResult))
                //    {
                //        //  loginModel = _service.Register_Social(model, out sResult);
                //        loginModel = _service.Login_Social(model, out sResult);
                //        data.IsNeedRegister = loginModel == null ? true : loginModel.IsNeedRegister;
                //    }
                //    if (string.IsNullOrEmpty(sResult) && loginModel != null && loginModel.IsNeedRegister == false)
                //    {
                //        sResult = await AutoLogin_Social(model, sResult, data, loginModel);
                //    }
                //    else
                //    {
                //        result.Msg = sResult;
                //    }
                //}
                result.Data = data;
            }
            catch (Exception ex)
            {
                sResult = Message_GeneralError;
                Log_Exception(ex, "SocialLogin", JsonHelper.SerializeObject(model));
            }
            if (string.IsNullOrEmpty(sResult))
            {
                result.StatusCode = (int)EzyResultCode.Success;
                result.Msg = Message_LoginSuccess;
            }
            else
            {
                result.Msg = sResult;
            }
            return result;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("SocialRegister")]
        public async Task<EzyResultObject<LoginSocialModel>> SocialRegister(UserLoginSocialModel model)
        {
            EzyResultObject<LoginSocialModel> result = new EzyResultObject<LoginSocialModel>() { StatusCode = (int)EzyResultCode.Error, Data = null };
            string sResult = "";
            try
            {
                LoginSocialModel data = new LoginSocialModel();
                data.SocialInfo = model;
                if (model == null || string.IsNullOrEmpty(model.SocialUserId) || string.IsNullOrEmpty(model.SocialDisplay))
                {
                    sResult = SystemText_GetValue("msg_sociallogin_invalidsocialaccount", "Your Social account is invalid. Please try again");
                }
                else
                {
                    SocialUserLoginModel loginModel = null;

                    if (string.IsNullOrEmpty(sResult))
                    {
                        loginModel = _service.Register_Social(model, out sResult);
                    }
                    if (string.IsNullOrEmpty(sResult) && loginModel != null)
                    {
                        sResult = await AutoLogin_Social(model, sResult, data, loginModel);
                    }
                    else
                    {
                    }
                }

                result.Data = data;
            }
            catch (Exception ex)
            {
                sResult = Message_GeneralError;
                Log_Exception(ex, "SocialRegister", JsonHelper.SerializeObject(model));
            }
            if (string.IsNullOrEmpty(sResult))
            {
                result.StatusCode = (int)EzyResultCode.Success;
                result.Msg = Message_LoginSuccess;
            }
            else
            {
                result.Msg = sResult;
            }
            return result;
        }

        [NonAction]
        private async Task<string> AutoLogin_Social(UserLoginSocialModel model, string sResult, LoginSocialModel data, SocialUserLoginModel loginModel)
        {
            try
            {
                var loginResult = this.LoginUser(new UserLoginModel()
                {
                    Username = loginModel.UserLoginId,
                    Password = SecurityHelper.GetPasswordHash_Social() + "_" + model.SocialUserId,
                    AppName = model.AppName,
                    DeviceNumber = model.DeviceNumber
                });
                HttpResponseMessage loginResponse = await loginResult;
                var sContent = loginResponse.Content == null ? "" : loginResponse.Content.ReadAsStringAsync().Result;
                OAuthTokenResponse token = null;
                if (!string.IsNullOrEmpty(sContent))
                {
                    token = Newtonsoft.Json.JsonConvert.DeserializeObject<OAuthTokenResponse>(sContent);
                }
                else
                {
                    sResult = loginResponse.ReasonPhrase;
                }
                data.Token = token;

                if (loginModel.IsNeedGetAvatar == true && model.SocialId == "facebook")
                {
                    GetFaceBookAvatar(loginModel, token.access_token);
                }
            }
            catch (Exception exLogin)
            {
                sResult = "Sorry, can not login. Please try again";
                Log_Exception(exLogin, "AutoLogin_Social", JsonHelper.SerializeObject(model));
            }

            return sResult;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="provider"></param>
        /// <param name="accessToken"></param>
        /// <param name="userId"></param>
        /// <param name="accessTokenSecret"></param>
        /// <returns></returns>
        //[NonAction]
        //public async Task<SocialUserInfo> GetExternalUserInfo(string provider, string accessToken, string userId, string accessTokenSecret)
        //{
        //    SocialUserInfo user = null;
        //    try
        //    {
        //        user = new SocialUserInfo() { email = "", gender = "", given_name = "", id = "", name = "", screen_name = "" };
        //        if (provider == ESCNetworkSocialIds.MEZY)
        //        {
        //            string sMessage = string.Empty;
        //            var iService = EzyFrameWorkManagement.CreateInstance<IUserAccessRegisterTokenService>("");
        //            var userToken = iService.VerifyToken(accessToken, out sMessage);
        //            if (userToken != null && !string.IsNullOrEmpty(userToken.Id))
        //            {
        //                user = new SocialUserInfo()
        //                {
        //                    email = userToken.EmailAddress,
        //                    name = userToken.DisplayName,
        //                    id = userToken.Id,
        //                    user_name = userToken.AccessCode + "_" + userToken.Username,
        //                    screen_name = userToken.UrlReferrer,
        //                    app_name = userToken.AccessCode
        //                };
        //            }
        //        }
        //        else
        //        {
        //            var verifyTokenEndPoint = "";
        //            string sAuth = "";
        //            if (provider == ESCNetworkSocialIds.FACEBOOK)
        //            {
        //                verifyTokenEndPoint = string.Format("https://graph.facebook.com/me?fields=id,name,email&access_token={0}", accessToken);
        //            }
        //            else if (provider == ESCNetworkSocialIds.GOOGLE)
        //            {
        //                //https://www.googleapis.com/oauth2/v1/userinfo?access_token=xxx
        //                verifyTokenEndPoint = string.Format("https://www.googleapis.com/oauth2/v1/userinfo?access_token={0}", accessToken);
        //            }
        //            else if (provider == ESCNetworkSocialIds.INSTAGRAM)
        //            {
        //                //  var clientId = "e626e085fefb450d9886a1f00e944e53";
        //                verifyTokenEndPoint = string.Format("https://api.instagram.com/v1/users/self/?access_token={0}", accessToken);
        //            }
        //            else if (provider == ESCNetworkSocialIds.TWITTER)
        //            {
        //                verifyTokenEndPoint = "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true";

        //                sAuth = GenerateTwitterOAuthHeader(verifyTokenEndPoint, accessToken, accessTokenSecret);
        //            }
        //            var client = new HttpClient();
        //            if (!string.IsNullOrEmpty(sAuth))
        //            {
        //                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("OAuth", sAuth);
        //            }

        //            var uri = new Uri(verifyTokenEndPoint);
        //            var response = await client.GetAsync(uri);

        //            if (response.IsSuccessStatusCode)
        //            {
        //                var content = await response.Content.ReadAsStringAsync();

        //                user = Newtonsoft.Json.JsonConvert.DeserializeObject<SocialUserInfo>(content);
        //            }
        //            else
        //            {
        //                var content = await response.Content.ReadAsStringAsync();
        //                Log_Exception(new Exception(string.Format("response: {0}, content: {1}", response.StatusCode, content)), "GetExternalUserInfo", string.Format("{0}---{1}---{2}---{3}", provider, accessToken, userId ?? "", accessTokenSecret ?? ""));
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        Log_Exception(ex, "GetExternalUserInfo", string.Format("{0}---{1}---{2}---{3}", provider, accessToken, userId ?? "", accessTokenSecret ?? ""));
        //    }

        //    return user;
        //}

        [NonAction]
        private async Task<ParsedExternalAccessToken> VerifyExternalAccessToken(string provider, string accessToken, string userId)
        {
            ParsedExternalAccessToken parsedToken = null;

            var verifyTokenEndPoint = "";

            if (provider == NetworkSocialIds.FACEBOOK)
            {
                //You can get it from here: https://developers.facebook.com/tools/accesstoken/
                //More about ESCug_tokn here: http://stackoverflow.com/questions/16641083/how-does-one-get-the-app-access-token-for-ESCug-token-inspection-on-facebook

                var appToken = "134284877156147|bER_WEuQQ_tAsWKMmtbal9zWp6I";// "846604942172725|efmrwj7QDtzO_E8IgfIlL3HvFiw";
                verifyTokenEndPoint = string.Format("https://graph.facebook.com/ESCug_token?input_token={0}&access_token={1}", accessToken, appToken);
            }
            else if (provider == NetworkSocialIds.GOOGLE)
            {
                //https://www.googleapis.com/oauth2/v1/userinfo?access_token=xxx
                verifyTokenEndPoint = string.Format("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={0}", accessToken);
            }
            else if (provider == NetworkSocialIds.INSTAGRAM)
            {
                //  var clientId = "e626e085fefb450d9886a1f00e944e53";
                verifyTokenEndPoint = string.Format("https://api.instagram.com/v1/users/self/?access_token={0}", accessToken);
            }
            else if (provider == NetworkSocialIds.TWITTER)
            {
                ////https://www.googleapis.com/oauth2/v1/userinfo?access_token=xxx
                verifyTokenEndPoint = string.Format("https://api.twitter.com/oauth/access_token={0}", accessToken);
            }
            var client = new HttpClient();
            var uri = new Uri(verifyTokenEndPoint);
            var response = await client.GetAsync(uri);

            if (response.IsSuccessStatusCode)
            {
                var config = SocialAuthenticationOptionManager.Instance;
                var content = await response.Content.ReadAsStringAsync();

                dynamic jObj = (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(content);

                parsedToken = new ParsedExternalAccessToken();

                if (provider == NetworkSocialIds.FACEBOOK)
                {
                    parsedToken.user_id = jObj["data"]["user_id"];
                    parsedToken.app_id = jObj["data"]["app_id"];

                    if (!string.Equals(config.FaceBook.AppId, parsedToken.app_id, StringComparison.OrdinalIgnoreCase))
                    {
                        return null;
                    }
                }
                else if (provider == NetworkSocialIds.GOOGLE)
                {
                    parsedToken.user_id = jObj["user_id"];
                    parsedToken.app_id = jObj["audience"];
                    if (!string.Equals(config.Google.AppId, parsedToken.app_id, StringComparison.OrdinalIgnoreCase))
                    {
                        return null;
                    }
                }
                else if (provider == NetworkSocialIds.INSTAGRAM)
                {
                    dynamic data = jObj["data"];

                    //  dynamic dtObj =  (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(data);
                    parsedToken.user_id = data["id"];

                    //  parsedToken.app_id = data["username"];
                    if (!string.Equals(userId, parsedToken.user_id, StringComparison.OrdinalIgnoreCase))
                    {
                        return null;
                    }
                }
                else if (provider == NetworkSocialIds.TWITTER)
                {
                }
            }

            return parsedToken;
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        //[HttpPost]
        //[Route("SocialUserInfo")]
        //public async Task<SocialUserInfo> GetExternalUserInfoTest(UserLoginSocialModel model)
        //{
        //    return await GetExternalUserInfo(model.SocialId, model.SocialToken, model.SocialUserId, model.SocialTokenSecret);
        //}

        [NonAction]
        private string GenerateTwitterOAuthHeader2(string url, string accessToken, string secretToken)
        {
            string consumerKey = "QyNpthAmSXivcmuAhvr1NYBnh";
            string consumerKeySecret = "8rdEu462fgHFyn4JGbGNo4eOVfgBK3QBLVKPSOycMlyEwbNOgT";

            var nonce = Guid.NewGuid().ToString();
            var timestamp = Convert.ToInt64((DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalSeconds).ToString(CultureInfo.InvariantCulture);
            var httpMethod = HttpMethod.Get;
            var uri = new Uri(url);
            var oauthParameters = new SortedDictionary<string, string>
                {
                    {"oauth_consumer_key", consumerKey},
                    {"oauth_nonce", nonce},
                    {"oauth_signature_method", "HMAC-SHA1"},
                    {"oauth_timestamp", timestamp},
                    {"oauth_token", accessToken},
                    {"oauth_version", "1.0"}
                };

            var signingParameters = new SortedDictionary<string, string>(oauthParameters);
            var parsedQuery = System.Web.HttpUtility.ParseQueryString(uri.Query);
            foreach (var k in parsedQuery.AllKeys)
                signingParameters.Add(k, parsedQuery[k]);

            var parameterString = string.Join("&", signingParameters.Keys.Select(k => $"{Uri.EscapeDataString(k)}={Uri.EscapeDataString(signingParameters[k])}"));

            var stringToSign = string.Join("&", new[] { httpMethod.Method.ToUpper(), uri.AbsoluteUri, parameterString }.Select(Uri.EscapeDataString));
            var signingKey = consumerKeySecret + "&" + secretToken;
            var signature = Convert.ToBase64String(new HMACSHA1(Encoding.ASCII.GetBytes(signingKey)).ComputeHash(Encoding.ASCII.GetBytes(stringToSign)));

            oauthParameters.Add("oauth_signature", signature);
            var authHeader = string.Join(",", oauthParameters.Keys.Select(k => $"{Uri.EscapeDataString(k)}=\"{Uri.EscapeDataString(oauthParameters[k])}\""));
            return authHeader;
        }

        [NonAction]
        private string GenerateTwitterOAuthHeader(string url, string accessToken, string secretToken)
        {
            string consumerKey = "QyNpthAmSXivcmuAhvr1NYBnh";
            string consumerKeySecret = "8rdEu462fgHFyn4JGbGNo4eOVfgBK3QBLVKPSOycMlyEwbNOgT";

            var oauth_version = "1.0";
            var oauth_signature_method = "HMAC-SHA1";

            // unique request details
            var oauth_nonce = Convert.ToBase64String(
                new ASCIIEncoding().GetBytes(DateTime.Now.Ticks.ToString()));
            var timeSpan = DateTime.UtcNow
                - new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            var oauth_timestamp = Convert.ToInt64(timeSpan.TotalSeconds).ToString();

            var resource_url = "https://api.twitter.com/1.1/account/verify_credentials.json";
            var request_query = "include_email=true";

            // create oauth signature
            var baseFormat = "oauth_consumer_key={0}&oauth_nonce={1}&oauth_signature_method={2}" +
                            "&oauth_timestamp={3}&oauth_token={4}&oauth_version={5}";

            var baseString = string.Format(baseFormat,
                                        consumerKey,
                                        oauth_nonce,
                                        oauth_signature_method,
                                        oauth_timestamp,
                                        accessToken,
                                        oauth_version
                                        );

            baseString = string.Concat("GET&", Uri.EscapeDataString(resource_url) + "&" + Uri.EscapeDataString(request_query), "%26", Uri.EscapeDataString(baseString));

            var compositeKey = string.Concat(Uri.EscapeDataString(consumerKeySecret),
                                    "&", Uri.EscapeDataString(secretToken));

            string oauth_signature;
            using (HMACSHA1 hasher = new HMACSHA1(ASCIIEncoding.ASCII.GetBytes(compositeKey)))
            {
                oauth_signature = Convert.ToBase64String(
                    hasher.ComputeHash(ASCIIEncoding.ASCII.GetBytes(baseString)));
            }

            // create the request header
            var headerFormat = "oauth_consumer_key=\"{0}\", oauth_nonce=\"{1}\", oauth_signature=\"{2}\", oauth_signature_method=\"{3}\", oauth_timestamp=\"{4}\", oauth_token=\"{5}\", oauth_version=\"{6}\"";

            var authHeader = string.Format(headerFormat,
                                    Uri.EscapeDataString(consumerKey),
                                    Uri.EscapeDataString(oauth_nonce),
                                    Uri.EscapeDataString(oauth_signature),
                                    Uri.EscapeDataString(oauth_signature_method),
                                    Uri.EscapeDataString(oauth_timestamp),
                                    Uri.EscapeDataString(accessToken),
                                    Uri.EscapeDataString(oauth_version)
                            );
            return authHeader;
        }
    }

    /// <summary>
    ///
    /// </summary>
    public class ParsedExternalAccessToken
    {
        /// <summary>
        ///
        /// </summary>
        public string user_id { get; set; }

        /// <summary>
        ///
        /// </summary>
        public string app_id { get; set; }
    }

    /// <summary>
    ///
    /// </summary>
    public class SocialUserInfo
    {
        /// <summary>
        ///
        /// </summary>
        public string id { get; set; }

        /// <summary>
        ///
        /// </summary>
        public string name { get; set; }

        /// <summary>
        ///
        /// </summary>
        public string email { get; set; }

        /// <summary>
        ///
        /// </summary>
        public string given_name { get; set; }

        /// <summary>
        ///
        /// </summary>
        public string gender { get; set; }

        /// <summary>
        ///
        /// </summary>
        public string screen_name { get; set; }

        /// <summary>
        ///
        /// </summary>
        public string picture { get; set; }

        /// <summary>
        ///
        /// </summary>
        public string user_name { get; set; }

        public string app_name { get; set; }
    }

    /// <summary>
    ///
    /// </summary>
    //public class FacebookUserModel
    //{
    //    /// <summary>
    //    ///
    //    /// </summary>
    //    public string Id { get; set; }

    //    /// <summary>
    //    ///
    //    /// </summary>
    //    public string FaceId { get; set; }
    //}
}