using Ezy.Module.MSSQLRepository.Connection;
using Microsoft.EntityFrameworkCore;
using System;

namespace SourceAPI.Core.Data.SourceData
{
    //public partial class SourceEntities
    //{
    //    public SourceEntities(string connectionString)
    //    {
    //        _connectionString = connectionString;
    //    }

    //    private readonly string _connectionString;

    //    partial void CustomizeConfiguration(ref DbContextOptionsBuilder optionsBuilder)
    //    {
    //        optionsBuilder.UseNpgsql(_connectionString);
    //    }
    //}

    //public class SourceDataContext : SourceEntities
    //{
    //    private static EzyEFConnectionSettingItem ConnManager = new EzyEFConnectionSettingItem(
    //   typeof(SourceDataContext), "");

    //    public static SourceDataContext GetInstance()
    //    {
    //        return GetInstance(false);
    //    }

    //    public static SourceDataContext GetInstance(bool isDevMode)
    //    {
    //        return GetInstance(isDevMode, null);
    //    }

    //    public static SourceDataContext GetInstance(bool isDevMode, Func<string> fGetConnectionString)
    //    {
    //        string sConnection = ConnManager.GetDataConnectionString(fGetConnectionString, isDevMode);
    //        var db = new SourceDataContext(sConnection);
    //        return db;
    //    }

    //    public SourceDataContext(string connectionString)
    //        : base(connectionString)
    //    {
    //    }
    //}
}
