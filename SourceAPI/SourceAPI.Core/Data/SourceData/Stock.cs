using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceAPI.Core.Data.SourceData
{
    public partial class Stock
    {
        public Stock()
        {
            OnCreated();
        }

        public virtual long Id { get; set; }

        public virtual string Code { get; set; }

        public virtual string Name { get; set; }

        public virtual int OrderNo { get; set; }

        public virtual string ColorCode { get; set; }

        public virtual bool IsDeleted { get; set; }

        public virtual DateTime? Log_CreatedDate { get; set; }

        public virtual string Log_CreatedBy { get; set; }

        public virtual DateTime? Log_UpdatedDate { get; set; }

        public virtual string Log_UpdatedBy { get; set; }

        public virtual string Note { get; set; }
        public virtual bool IsDisable { get; set; }

        public virtual string TimeStampText { get; set; }

        #region Extensibility Method Definitions

        partial void OnCreated();

        #endregion
    }
}
