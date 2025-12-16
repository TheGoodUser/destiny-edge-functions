export interface CompanyProfileModel {
  plans?: Record<string, any> | null;
  companyName?: string | null;
  companyEmail?: string | null;
  companyLogo?: string | null;
  paidSwipesCount?: number | null;
}

export class CompanyProfileModel {
  plans?: Record<string, any> | null;
  companyName?: string | null;
  companyEmail?: string | null;
  companyLogo?: string | null;

  constructor(data: {
    plans?: Record<string, any> | null;
    companyName?: string | null;
    companyEmail?: string | null;
    companyLogo?: string | null;
    paidSwipes?: number | null;
  } = {}) {
    this.plans = data.plans;
    this.companyName = data.companyName;
    this.companyEmail = data.companyEmail;
    this.companyLogo = data.companyLogo;
    this.paidSwipesCount;
  }

  static fromMap(map: Record<string, any>): CompanyProfileModel {
    return new CompanyProfileModel({
      plans: map["plans"],
      companyName: map["company_name"],
      companyEmail: map["company_email"],
      companyLogo: map["company_logo"],
      paidSwipes: map["paid_swipes"],
    });
  }
}
