using System;

namespace SourceAPI.Core.Data.Stores
{
    public class sp_BaseParam
    {
        public DateTime? FromDate { get; set; }

        public DateTime? ToDate { get; set; }

        /// <summary>
        /// de dung cho store json JSON_VALUE(@jsonParam, '$.FromDate_Text')
        /// Json parse : Null -> date null
        /// Json parse : Empty -> date 1900-01-01
        /// Json parse : yyyy-MM-dd HH:mm:ss -> date yyyy-MM-dd HH:mm:ss
        /// </summary>
        public string FromDate_Text
        {
            get
            {
                string sText = null;
                if (FromDate != null)
                {
                    sText = FromDate.Value.ToString("yyyy-MM-dd HH:mm:ss");
                }
                return sText;
            }
        }

        /// <summary>
        /// de dung cho store json JSON_VALUE(@jsonParam, '$.ToDate_Text')
        /// Json parse : Null -> date null
        /// Json parse : Empty -> date 1900-01-01
        /// Json parse : yyyy-MM-dd HH:mm:ss -> date yyyy-MM-dd HH:mm:ss
        /// </summary>
        public string ToDate_Text
        {
            get
            {
                string sText = null;
                if (ToDate != null)
                {
                    sText = ToDate.Value.ToString("yyyy-MM-dd HH:mm:ss");
                }
                return sText;
            }
        }
    }
    public class sp_GetListPostcodeCheckInfo_JsonParam
    {
        public long? ParentId { get; set; }
    }
    public class sp_RHL_ApplicationForm_Check_CombinationLoan_JsonParam
    {
        public long? AppId { get; set; }
    }
    public class sp_GetReportPayslipGrpByStaff_JsonParam : sp_BaseParam
    {
        public long? StaffId { get; set; }
    }
    public class sp_GetSMSQueueReport_JsonParam : sp_GetMessageQueueReport_JsonParam
    {
    }
    public class sp_GetReduceWebSupport_Url_JsonParam
    { 
        public long? Id { get; set; }
    }
    public class sp_GetMessageQueueReport_JsonParam : sp_BaseParam
    {
        public string Subject { get; set; }
        public string Receive { get; set; }
    }
}
