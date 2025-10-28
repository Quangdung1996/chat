//using Microsoft.Reporting.WebForms;
using SourceAPI.Shared.Helper;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Xml;
using System.Xml.Serialization;

namespace SourceAPI.Shared.Services
{
    //public partial class ReportingService
    //{
    //    private List<ReportParameter> _parameters = new List<ReportParameter>();

    //    private LocalReport localReport;

    //    public void DisposeControl()
    //    {
    //        try
    //        {
    //        }
    //        catch
    //        {
    //        }
    //    }

    //    public ReportingService()
    //    {
    //        localReport = new LocalReport();
    //    }

    //    #region Load Report

    //    public void LoadLocalReport(string filePath)
    //    {
    //        localReport.ReportPath = filePath;
    //        RetreiveDataSourceList();
    //    }

    //    private void RetreiveDataSourceList()
    //    {
    //        var datasource = localReport.GetDataSourceNames();
    //        localReport.DataSources.Clear();
    //        foreach (string dsName in datasource)
    //        {
    //            localReport.DataSources.Add(new ReportDataSource(dsName));
    //        }
    //    }

    //    public void LoadLocalReportFromBinary(byte[] content)
    //    {
    //        if (content == null)
    //            return;
    //        using (MemoryStream ms = new MemoryStream(content))
    //        {
    //            localReport.LoadReportDefinition(ms);
    //            ms.Close();
    //        }

    //        //RetreiveDataSourceList();
    //    }

    //    #endregion Load Report

    //    #region Parameters

    //    public void SetParameters(IEnumerable<ReportParameter> parameters)
    //    {
    //        _parameters.Clear();
    //        _parameters = parameters.ToList();
    //    }

    //    public void AddParameter(string paramName, string paramValue)
    //    {
    //        _parameters.Add(new ReportParameter(paramName, paramValue));
    //    }

    //    public void AddParameter(string paramName, string[] paramValues)
    //    {
    //        _parameters.Add(new ReportParameter(paramName, paramValues));
    //    }

    //    public void RemoveParameter(string paramName)
    //    {
    //        ReportParameter indicatedParam = _parameters.FirstOrDefault(p => p.Name == paramName);
    //        if (indicatedParam != null)
    //            _parameters.Remove(indicatedParam);
    //    }

    //    public void RemoveParameter(int index)
    //    {
    //        _parameters.RemoveAt(index);
    //    }

    //    public void RemoveAllParameter(Predicate<ReportParameter> match)
    //    {
    //        _parameters.RemoveAll(match);
    //    }

    //    #endregion Parameters

    //    #region DataSource

    //    public void SetLocalDataSource(string name, object value)
    //    {
    //        if (localReport != null && localReport.DataSources != null && localReport.DataSources.Count > 0)
    //        {
    //            localReport.DataSources[name].Value = value;
    //        }
    //        else
    //        {
    //            // Debug.Fail("Need test again");
    //        }
    //    }

    //    //public void SetLocalDataSource(ReportDataSource[] datasource)
    //    //{
    //    //    if (datasource != null && datasource.Length > 0)
    //    //    {
    //    //        foreach (var s in datasource)
    //    //            localReport.DataSources.Add(s);
    //    //    }
    //    //}

    //    #endregion DataSource

    //    #region Show Report

    //    public void ShowReport(NetworkCredential credentials)
    //    {
    //        if (_parameters.Count > 0)
    //            localReport.SetParameters(_parameters);

    //        if (_parameters != null && _parameters.Count > 0)
    //            _parameters.Clear();
    //    }

    //    public void ShowReport()
    //    {
    //        ShowReport(CredentialCache.DefaultNetworkCredentials);
    //    }

    //    #endregion Show Report

    //    #region Utilities

    //    public byte[] ReportExport(string exportType, DeviceInfo deviceInfo)
    //    {
    //        return ReportExport(exportType, deviceInfo, CredentialCache.DefaultNetworkCredentials);
    //    }

    //    public byte[] ReportExport(string exportType, DeviceInfo deviceInfo, NetworkCredential credentials)
    //    {
    //        byte[] outputStream = null;
    //        string format = exportType;
    //        string encoding = "Unicode";
    //        string mimeType;
    //        string extension;
    //        Warning[] warnings = null;
    //        string[] streamIDs = null;
    //        try
    //        {
    //            localReport.EnableExternalImages = true;
    //            if (_parameters.Count > 0)
    //                localReport.SetParameters(_parameters);
    //            outputStream = localReport.Render(exportType, deviceInfo.ToXML(), out mimeType, out encoding, out extension, out streamIDs, out warnings);

    //            return outputStream;
    //        }
    //        catch (Exception ex)
    //        {
    //            SQLDataContextHelper.LogException<string>(ex, "ReportExport", "");
    //            return null;
    //        }
    //    }

    //    #endregion Utilities
    //}

    //public static class RSExportType
    //{
    //    public const string XML = "XML";

    //    public const string NULL = "NULL";

    //    public const string CSV = "CSV";

    //    public const string IMAGE = "IMAGE";

    //    public const string PDF = "PDF";

    //    public const string HTML4_0 = "HTML4.0";

    //    public const string HTML3_2 = "HTML3.2";

    //    public const string MHTML = "MHTML";

    //    public const string EXCEL = "EXCEL";

    //    public const string EXCEL_2013 = "EXCELOPENXML";

    //    public const string RGDI = "RGDI";

    //    public const string WORD = "WORD";
    //}

    //public abstract class DeviceInfo
    //{
    //    private static XmlSerializer xs = null;

    //    public string ToXML()
    //    {
    //        return SerializeObject(this);
    //    }

    //    private String SerializeObject(Object pObject)
    //    {
    //        try
    //        {
    //            StringBuilder XmlizedString = new StringBuilder();
    //            using (MemoryStream memoryStream = new MemoryStream())
    //            {
    //                Init_XmlSerializer();

    //                XmlSerializerNamespaces ns = new XmlSerializerNamespaces();
    //                ns.Add("", "");

    //                XmlWriterSettings settings = new XmlWriterSettings();
    //                settings.OmitXmlDeclaration = true;
    //                settings.Encoding = Encoding.UTF8;
    //                settings.Indent = true;

    //                XmlWriter xmlTextWriter = XmlTextWriter.Create(XmlizedString, settings);
    //                xs.Serialize(xmlTextWriter, pObject, ns);

    //                return XmlizedString.ToString();
    //            }
    //        }
    //        catch
    //        {
    //            return null;
    //        }
    //    }

    //    private void Init_XmlSerializer()
    //    {
    //        if (xs == null)
    //        {
    //            XmlRootAttribute root = new XmlRootAttribute("DeviceInfo");
    //            xs = new XmlSerializer(this.GetType(), root);
    //        }
    //    }
    //}

    //public class ExcelDeviceInfo : DeviceInfo
    //{
    //    public bool OmitDocumentMap = false;

    //    public bool OmitFormulas = false;

    //    public string RemoveSpace = "0.125in";

    //    public bool SimplePageHeaders = false;
    //}
}