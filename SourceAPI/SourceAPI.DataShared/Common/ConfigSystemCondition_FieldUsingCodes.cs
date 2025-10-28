using Ezy.Module.Library.Data;
using Ezy.Module.Library.Utilities;
using System.Collections.Generic;

namespace SourceAPI.DataShared.Common
{
    public partial class ConfigSystemCondition_FieldUsingCodes
    {
        public const string MaxLVRMatrixCondition = "ConfigMaxLVRMatrixCondition";
        public const string CreditRuleCondition = "ConfigCreditRuleCondition";
        public const string DocumentCheckListCondition = "ConfigDocumentCheckListCondition";

        private static readonly Dictionary<string, string> Dict_Name = new()
        {
            { MaxLVRMatrixCondition, "Max LVR Matrix" },
            { CreditRuleCondition, "Credit Rule Checklist" },
            { DocumentCheckListCondition, "Document Checklist" }
        };

        public static BaseCategoryItem[] GetAllScreens()
        {
            var result = new List<BaseCategoryItem>();
            var fields = typeof(ConfigSystemCondition_FieldUsingCodes).GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
            foreach (var field in fields)
            {
                var temp = field.GetValue(null);
                if (temp != null)
                {
                    string fieldName = temp.ToString();
                    string sField = fieldName;
                    var name = Dict_Name.GetValue_Dic(fieldName);
                    if (!string.IsNullOrEmpty(name)) fieldName = name;
                    result.Add(new()
                    {
                        Text = fieldName,
                        Value = sField
                    });
                }
            }
            return result.ToArray();
        }
    }
}
