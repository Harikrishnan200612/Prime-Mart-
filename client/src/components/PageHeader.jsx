import React from 'react';

const PageHeader = ({ icon, title, subtitle, action, tone = 'blue' }) => (
  <div className={`page-header page-header-modern ${tone}`}>
    <div className="page-heading">
      <div className="page-heading-title"><span className="page-heading-icon">{icon}</span><h1>{title}</h1></div>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {action && <div className="page-actions">{action}</div>}
  </div>
);

export default PageHeader;
