using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.DataShared.Common
{
    public class SystemB2BType
    {
        public const string ZOHO = "ZOHO";
        public const string SOEZY = "SOEZY";
        public const string DESEARCH = "DESEARCH";
        public const string SESOLUTIONSEARCH = "SESOLUTIONSEARCH";
        public const string SYNC_CATEGORY = "SYNC_CATEGORY";
    }

    public class SystemB2BConfigSubKeys
    {
        public const string SETTING = "SETTING";
        public const string DATA_B2BSEARCH = "DATA_B2BSEARCH";

        #region Zoho
        public const string CONTACTS_API = "CONTACTS_API";
        public const string DEALS_API = "DEALS_API";
        public const string USERS_API = "USERS_API";
        public const string LEADS_API = "LEADS_API";

        public const string ACCESS_TOKEN_INFO_API = "ACCESS_TOKEN_INFO_API";
        public const string ACCESS_TOKEN_INFO = "ACCESSTOKEN_INFO";

        public const string REFRESH_TOKEN_INFO_API = "REFRESH_TOKEN_INFO_API";

        public const string OWNER_DEFAULT_FOR_CLIENT = "OWNER_DEFAULT_FOR_CLIENT";
        public const string OWNER_DEFAULT_FOR_DEAL = "OWNER_DEFAULT_FOR_DEAL";
        public const string OWNER_DEFAULT_FOR_LEAD = "OWNER_DEFAULT_FOR_LEAD";

        public const string DEFAULT_VALUES_FOR_LEAD = "DEFAULT_VALUES_FOR_LEAD";

        #region Users
        public const string ACCESS_TOKEN_USERS_INFO = "ACCESS_TOKEN_USERS_INFO";
        #endregion

        #endregion

        public const string BROKER_LIST_API = "BROKER_LIST_API";

        #region SESOLUTIONSEARCH
        public const string UPFRONT_FEES = "UPFRONT_FEES";
        #endregion SESOLUTIONSEARCH
    }

    public class B2BSubmitTypeCodes
    {
        public const string Zoho_Insert_Deal = "Zoho_Insert_Deal";
        public const string Zoho_Insert_Contact = "Zoho_Insert_Contact";
        public const string Update_Contact_ClientOwner_From_Zoho = "Update_Contact_ClientOwner_From_Zoho";
        public const string Zoho_Update_Contact = "Zoho_Update_Contact";
        public const string UpdateSoezyIdForDeal = "UpdateSoezyIdForDeal";
        public const string Zoho_Insert_Lead = "Zoho_Insert_Lead";


        //public const string Zoho_Update_Contact = "Zoho_Update_Contact";
        //public const string UpdateSoezyIdForDeal = "UpdateSoezyIdForDeal";
    }
}
