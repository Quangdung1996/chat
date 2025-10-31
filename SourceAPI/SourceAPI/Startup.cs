using Ezy.ApiService.ReleaseService.Service;
using Ezy.APIService.AppSystemAPI.Provider;
using Ezy.APIService.AppSystemService.Helpers;
using Ezy.APIService.Core.Data;
using Ezy.APIService.SharedController.Services;
using Ezy.Module.Library.Utilities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json.Serialization;
using SourceAPI.Core.DataInfo.Cached;
using SourceAPI.Extensions;
using SourceAPI.Shared.Engines;
using SourceAPI.Shared.Helper;
using SourceAPI.Shared.Services;
using SourceAPI.Middleware;
using System;
using System.IO;
using System.Linq;

namespace SourceOAWebAPI
{
    public partial class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var config = SocialAuthenticationOptionManager.Instance;
            services.AddCors();
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                 .AddJwtBearer(options =>
                 {
                     options.TokenValidationParameters = JwtSecurityKey.GetTokenValidationParameters();
                     options.Events = new JwtBearerEvents
                     {
                         OnAuthenticationFailed = context =>
                         {
                             return JwtBearerEventHelper.OnAuthenticationFailed(context);
                         },
                         OnTokenValidated = context =>
                         {
                             return JwtBearerEventHelper.OnTokenValidated(context);
                         },
                     };
                 });
            services.AddControllers().AddNewtonsoftJson(opt =>
                 opt.SerializerSettings.ContractResolver = new DefaultContractResolver());// giu dung field name, ko bien thanh lower het
            services.AddDirectoryBrowser();

            #region Login

            // Google
            if (config.Google != null && !string.IsNullOrEmpty(config.Google.AppId) && !string.IsNullOrEmpty(config.Google.AppSecret))
            {
                services.AddAuthentication().AddGoogle(options =>
                {
                    IConfigurationSection googleAuthNSection =
                    Configuration.GetSection("Authentication:Google");

                    options.ClientId = config.Google.AppId;
                    options.ClientSecret = config.Google.AppSecret;
                });
            }


            // Facebook
            if (config.FaceBook != null && !string.IsNullOrEmpty(config.FaceBook.AppId) && !string.IsNullOrEmpty(config.FaceBook.AppSecret))
            {
                services.AddAuthentication().AddFacebook(facebookOptions =>
            {
                facebookOptions.AppId = config.FaceBook.AppId;
                facebookOptions.AppSecret = config.FaceBook.AppSecret;
            });
            }
            #endregion Login

            //#region Swagger

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "ESC API DOCUMENTS", Version = "v1" });
                c.ResolveConflictingActions(apiDescriptions => apiDescriptions.Last());
            });

            //#endregion Swagger

            services.Configure<FormOptions>(x =>
            {
                x.ValueLengthLimit = int.MaxValue;
                x.MultipartBodyLengthLimit = int.MaxValue; // In case of multipart
            });
            services.AddSignalR();

            // Register Rocket.Chat services
            services.AddRocketChatServices(Configuration);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
            }
            //app.UseHttpsRedirection();
            SetupUseStaticFiles(app, env);
            app.UseRouting();
            app.UseCors(x => x
               .AllowAnyMethod()
               .AllowAnyHeader()
               .SetIsOriginAllowed(origin => true) // allow any origin
               .AllowCredentials()); // allow credentials
            
            // Rocket.Chat middlewares
            app.UseRocketChatToken();      // Extract Rocket.Chat token from headers
            app.UseRocketChatApiKey();     // Validate API key for integration endpoints
            
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHub<NotificationHub>("/NotificationHub");
            });
            string folderPath = env.ContentRootPath;

            if (ApplicationSettingInfo.Instance.ServerOS == "Linux")
            {
                folderPath = AppDomain.CurrentDomain.BaseDirectory;
            }

            folderPath = EzyIOHelper.PathCombine(folderPath, "Views", "Home");

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(folderPath),
                RequestPath = "/home"
            });

            #region Swagger

            app.UseDeveloperExceptionPage();
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("v1/swagger.json", "API DOCUMENTS"));

            #endregion Swagger
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            });
            FirstRun();
        }

        private void SetupUseStaticFiles(IApplicationBuilder app, IWebHostEnvironment env)
        {
            string sRootFolder = Directory.GetCurrentDirectory();
            if (env.IsDevelopment())
            {
                sRootFolder = AppDomain.CurrentDomain.BaseDirectory;
            }
            if (ApplicationSettingInfo.Instance.ServerOS == "Linux")
            {
                sRootFolder = AppDomain.CurrentDomain.BaseDirectory;
            }
            var opt = new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(sRootFolder)
            };
            app.UseStaticFiles(opt);
        }

        private void FirstRun()
        {
            string firstRunMessage = string.Empty;
            try
            {
                EzyAPIStartupService.StartupService();
                CachedDataManagement.RefreshCacheAll();
                bool isStart = ApplicationSettingInfo.Instance.IsDontRunEngine == false;
                ReduceEngineHelper.StartAllEngines(isStart);
                EzyFA2AuthenticatorManager.Register();
                FrameWorkManagement.InitServiceWithSystemConfig();
            }
            catch (Exception ex)
            {
                SQLDataContextHelper.LogException(ex, "FirstRun", null);
                firstRunMessage = ex.Message;
            }
            ConfigReleaseSupportService.ActionAfterCheckRelease = new(() =>
            {
                AppSystemReleaseSupportHelper.ActionAfterCheckNewRelease(firstRunMessage, AppDomain.CurrentDomain.BaseDirectory.ContainIgnoreCase("debug"));
            });
        }
    }
}
