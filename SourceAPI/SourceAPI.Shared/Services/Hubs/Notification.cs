//using Ezy.ApiService.NotifyService.Service;
using Ezy.ApiService.ReleaseService.Helper;
using Ezy.APIService.Core.Services;
//using Ezy.APIService.NotifyService.Helper;
using Ezy.Module.BaseService.FrameWork;
using Ezy.Module.Library.Message;
using Microsoft.AspNetCore.SignalR;
using SourceAPI.Core.DataInfo.Cached;
using SourceAPI.DataShared.Common;
using SourceAPI.Shared.Helper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.Shared.Services
{
    public class NotificationSenderParamModel
    {
        public string id { get; set; }
        public string type { get; set; }
    }
    public enum eTypeSinalR
    {
        SignalR_NotifyCount,
        SignalR_Connected
    }
    public class NotificationSignalRBase : EzyResultMessage
    {
        public string Type { get; set; }
    }
    public class NotificationSignalR_Count : NotificationSignalRBase
    {
        public int NotifyCount { get; set; }
    }
    public static class NotificationHubHelper
    {
        public static Dictionary<string, List<NotificationConnection>> NotificationHub_Dic = new Dictionary<string, List<NotificationConnection>>();
        public static Dictionary<string, List<NotificationConnection>> NotificationHub_App_Dic = new Dictionary<string, List<NotificationConnection>>();
        public static void SendMessage(this IHubContext<NotificationHub> hub, NotificationSenderParamModel param)
        {
            #region LogMethodVersion
            MethodBase.GetCurrentMethod().LogMethodVersion("20220624-1517", "Reduce - Mang Signal R từ DNT qua - 20220624",
                "https://allianceitscvn.atlassian.net/browse/ROA-636");
            #endregion LogMethodVersion
            if (NotificationHub_Dic.ContainsKey(param.id))
            {
                //var connections = NotificationHub_Dic[param.id].ToArray();
                //if (connections != null && connections.Length > 0)
                //{
                //    if (param.type == eTypeSinalR.SignalR_NotifyCount.ToString())
                //    {
                //        var service = EzyFrameWorkManagement.CreateInstance<INotificationMessageService>();
                //        var result = service.GetTotalNew(param.id, new string[] { }, out string sMessage);
                //        if (result != null)
                //        {
                //            foreach (var con in connections)
                //            {
                //                hub.Clients.Clients(con.ConnectionId).SendAsync("ReceiveMessage", new NotificationSignalR_Count()
                //                {
                //                    Type = param.type,
                //                    NotifyCount = result.Count, //Các Notify chưa đọc
                //                    StatusCode = 200
                //                });
                //            }
                //        }
                //    }
                //}
            }
            if (NotificationHub_App_Dic.ContainsKey(param.id))
            { 
                //Send appid --> Code here
            }
        }
        public static void SendMessage4Test(this IHubContext<NotificationHub> hub, string id, Dictionary<string, object> dic)
        {
            if (NotificationHub_Dic.ContainsKey(id))
            {
                var connections = NotificationHub_Dic[id].ToArray();
                foreach (var con in connections)
                {
                    hub.Clients.Clients(con.ConnectionId).SendAsync("ReceiveMessage", dic);
                }
            }
        }
    }
    public class NotificationConnection
    {
        public string ConnectionId { get; set; }
        public DateTime ConnectedAt { get; set; }
    }
    public class NotificationHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            var connectionId = this.Context.ConnectionId;
            try
            {
                var key = Context.GetHttpContext().Request.Query["key"];
                var userGUId = Context.GetHttpContext().Request.Query["uid"];
                var appId = Context.GetHttpContext().Request.Query["appid"];
                var keyAccept = SystemConfigHelper.GetValueFromConfig(SystemConfigKeys.System_Security_Key_SignalR, "gjkgfwHF8534jkgsdnklhds");
                if (key == keyAccept)
                {
                    var user = CachedDataManagement.UserLogins.FirstOrDefault(t => t.ID_GUID.HasValue && t.ID_GUID.Value.ToString() == userGUId);
                    if (user != null)
                    {
                        var userId = SQLDataContextHelper.ConvertToStringId(user.Id);
                        if (NotificationHubHelper.NotificationHub_Dic.ContainsKey(userId))
                        {
                            NotificationHubHelper.NotificationHub_Dic[userId].Add(new NotificationConnection() { ConnectionId = connectionId });
                        }
                        else
                        {
                            NotificationHubHelper.NotificationHub_Dic.Add(userId, new List<NotificationConnection>()
                            {
                                new NotificationConnection(){ ConnectionId = connectionId, ConnectedAt = DateTime.Now }
                            });
                        }
                        return Clients.Client(connectionId).SendAsync("ReceiveMessage", new NotificationSignalRBase()
                        {
                            Msg = $"user {userId} joined system notify signalR",
                            StatusCode = 200,
                            Type = eTypeSinalR.SignalR_Connected.ToString()
                        });
                    }
                    else if (!string.IsNullOrEmpty(appId))
                    {
                        if (NotificationHubHelper.NotificationHub_App_Dic.ContainsKey(appId))
                        {
                            NotificationHubHelper.NotificationHub_App_Dic[appId].Add(new NotificationConnection() { ConnectionId = connectionId });
                        }
                        else
                        {
                            NotificationHubHelper.NotificationHub_App_Dic.Add(appId, new List<NotificationConnection>()
                            {
                                new NotificationConnection(){ ConnectionId = connectionId, ConnectedAt = DateTime.Now }
                            });
                        }
                        return Clients.Client(connectionId).SendAsync("ReceiveMessage", new NotificationSignalRBase()
                        {
                            Msg = $"app {appId} joined system notify signalR",
                            StatusCode = 200,
                            Type = eTypeSinalR.SignalR_Connected.ToString()
                        });
                    }
                    else
                    {
                        return Clients.Client(connectionId).SendAsync("ReceiveMessage", new NotificationSignalRBase()
                        {
                            Msg = "uid is not correct",
                            StatusCode = 400
                        });
                    }
                }
                else
                {
                    return Clients.Client(connectionId).SendAsync("ReceiveMessage", new NotificationSignalRBase()
                    {
                        Msg = "Key is not correct",
                        StatusCode = 400
                    });
                }
            }
            catch (Exception ex)
            {
                SQLDataContextHelper.LogException(ex, "OnConnectedAsync", "system");
                //return Clients.Client(connectionId).SendAsync("ReceiveMessage", new NotificationSignalRBase()
                //{
                //    Msg = ex.Message,
                //    StatusCode = 400
                //});
                return null;
            }
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            var name = Context.GetHttpContext().Request.Query["name"];
            //return Clients.All.SendAsync("ReceiveMessage", $"{name} left the chat");
            return null;
        }

        public Task Send(string name, string message)
        {
            if (Clients != null)
            {
                return Clients.All.SendAsync("ReceiveMessage", $"{name}: {message}");
            }
            else
            {
                return Task.CompletedTask;
            }
        }
        public Task SendMessage(string message)
        {
            if (Clients != null)
            {
                return Clients.All.SendAsync("ReceiveMessage", $"{message}");
            }
            else
            {
                return Task.CompletedTask;
            }
        }
        public Task SendToOthers(string name, string message)
        {
            return Clients.Others.SendAsync("ReceiveMessage", $"{name}: {message}");
        }

        public Task SendToConnection(string connectionId, string name, string message)
        {
            return Clients.Client(connectionId).SendAsync("Send", $"Private message from {name}: {message}");
        }

        public Task SendToGroup(string groupName, string name, string message)
        {
            return Clients.Group(groupName).SendAsync("ReceiveMessage", $"{name}@{groupName}: {message}");
        }

        public Task SendToOthersInGroup(string groupName, string name, string message)
        {
            return Clients.OthersInGroup(groupName).SendAsync("ReceiveMessage", $"{name}@{groupName}: {message}");
        }

        public async Task JoinGroup(string groupName, string name)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            await Clients.Group(groupName).SendAsync("ReceiveMessage", $"{name} joined {groupName}");
        }

        public async Task LeaveGroup(string groupName, string name)
        {
            await Clients.Group(groupName).SendAsync("ReceiveMessage", $"{name} left {groupName}");

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        public Task Echo(string name, string message)
        {
            return Clients.Caller.SendAsync("ReceiveMessage", $"{name}: {message}");
        }
    }
}
