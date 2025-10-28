using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.DataShared.Common
{
    public class ApplicationStatusCodes
    {
        public const string New = "New";
        public const string ConditionallyApproved = "ConditionallyApproved";

        public const string Referred = "Referred";
        public const string ReferredWithException = "ReferredWithException";
        public const string Submitted = "Submitted";
        public const string Deleted = "Deleted";
        public const string Expried = "Expried";
       
        public const string Confirmed = "Confirmed";
        public const string PrivacySigned = "PrivacySigned";

        public const string FormallyApproved = "FormallyApproved";
        public const string FormallyReferred = "FormallyReferred";
        public const string FormallyReferredWithException = "FormallyReferredWithException";
    }
}
