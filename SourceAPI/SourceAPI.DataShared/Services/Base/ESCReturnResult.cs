using Ezy.Module.Library.Message;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace SourceAPI.DataShared.Services
{
    public enum RHLResultCode
    {
        Success = 1,

        Error = 0,

        Unauthorized = 401,

        Ok = 200,

        ServerError = 500,

        BadRequest = 400,

        NotFound = 404
    }

    public class ERHLBaseAPIResultObject : EzyBaseAPIResultObject
    {
    }

    public class RHLBaseAPIParamObject<TParam> : EzyBaseAPIParamObject<TParam>
    {
    }

   
    public class ReduceBaseAPIParamObject<TParam> : EzyBaseAPIParamObject<TParam>
    {
    }
    public class ReduceBaseAPIResultObject : EzyBaseAPIResultObject
    {
    }
}
