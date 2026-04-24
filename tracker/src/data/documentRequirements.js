  import barangayClearance from "../assets/forms/Barangay/Barangay Clearance.png";
  import barangayResidency from "../assets/forms/Barangay/Certificate of Residency.png";
  import barangayIndigency from "../assets/forms/Barangay/Certificate of Indigency.png";
  import firstTimeJobseekerCert from "../assets/forms/Barangay/Barangay Certification - First Time Job Seeker.png";
  import firstTimeJobseekerOath from "../assets/forms/Barangay/Oat of Undertaking - First Time Job Seeker Form.png";
  import barangayCertification from "../assets/forms/Barangay/Barangay Certification.png";
  import barangayCertificationResidency from "../assets/forms/Barangay/Barangay Certification - Residency.png";
  import certificateOfAttestation from "../assets/forms/Barangay/Certificate of Attestation.png";

  import marriageLicense from "../assets/forms/LGU/Application of Marriage License.png";
  import deathCert1 from "../assets/forms/LGU/Certificate of Death 1.png";
  import deathCert2 from "../assets/forms/LGU/Certificate of Death 2.png";
  import fetalDeath1 from "../assets/forms/LGU/Certificate of Fetal Death.png";
  import fetalDeath2 from "../assets/forms/LGU/Certificate of Fetal Death 2.png";
  import marriageCert1 from "../assets/forms/LGU/Certificate of Marriage 1.png";
  import marriageCert2 from "../assets/forms/LGU/Certificate of Marriage 2.png";
  import lguMap from "../assets/forms/LGU/LGU - Map.png";
  import noRealProperty from "../assets/forms/LGU/No Real Property Unit.png";
  import noticeAssessment from "../assets/forms/LGU/Notice of Assessment - Land Bank of the Philippines.png";
  import realProperty1 from "../assets/forms/LGU/Real Property Field Appraisal and Assessment Sheet - Land and other improvements 1.png";
  import realProperty2 from "../assets/forms/LGU/Real Property Field Appraisal and Assessment Sheet - Land and other improvements 2.png";
  import residentialAgriLand from "../assets/forms/LGU/Residential or Agricultural Land.png";
  import taxDeclaration from "../assets/forms/LGU/Task Declaration of Real Property.png";

  const required = true;
  const optional = false;

  export const documentRequirements = {
    "Barangay Clearance": {
      id: 1,
      category: "Barangay",
      fee: "₱50.00",
      time: "1–2 working days",
      images: [barangayClearance],
      description:
        "A Barangay Clearance certifies that the applicant is a person of good moral character and has no derogatory record in the barangay.",
      uploadLabel: "Upload Valid ID / Birth Certificate",
      fields: [
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required,
        },
        {
          name: "birth_date",
          label: "Date of Birth",
          type: "date",
          required,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter your complete address",
          required,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Employment, school, ID requirement",
          required,
        },
      ],
    },

    "Certificate of Residency": {
      id: 2,
      category: "Barangay",
      fee: "₱30.00",
      time: "1 working day",
      images: [barangayResidency],
      description:
        "A Certificate of Residency confirms that the applicant is a bonafide resident of the barangay.",
      uploadLabel: "Upload Valid ID / Proof of Address",
      fields: [
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter your current address",
          required,
        },
        {
          name: "years_residing",
          label: "Years Residing",
          type: "number",
          placeholder: "Example: 5",
          required,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: School, work, government requirement",
          required,
        },
      ],
    },

    "Certificate of Indigency": {
      id: 3,
      category: "Barangay",
      fee: "Free",
      time: "1–2 working days",
      images: [barangayIndigency],
      description:
        "Issued to qualified low-income residents who need financial, school, or medical assistance.",
      uploadLabel: "Upload Valid ID / Supporting Proof",
      fields: [
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter your complete address",
          required,
        },
        {
          name: "monthly_income",
          label: "Monthly Income",
          type: "number",
          placeholder: "Example: 5000",
          required,
        },
        {
          name: "assistance_type",
          label: "Assistance Needed",
          type: "text",
          placeholder: "Example: Medical, school, financial assistance",
          required,
        },
      ],
    },

    "First Time Jobseeker": {
      id: 4,
      category: "Barangay",
      fee: "Free",
      time: "1–2 working days",
      images: [firstTimeJobseekerCert],
      description:
        "Choose either First Time Jobseeker Certification or Oath of Undertaking.",
      uploadLabel: "Upload Valid ID / Proof of Residency",
      hasChoices: true,
      choices: [
    {
      id: "first_time_jobseeker_cert",
      title: "Barangay Certification - First Time Job Seeker",
      images: [firstTimeJobseekerCert],
      description:
        "Certification for first-time jobseekers availing benefits under RA 11261.",
      uploadLabel: "Upload Valid ID / Proof of Residency",
      fields: [
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required: true,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter your complete address",
          required: true,
        },
        {
          name: "years_residing",
          label: "Years Residing",
          type: "number",
          placeholder: "Example: 5",
          required: true,
        },
      ],
    },
    {
      id: "first_time_jobseeker_oath",
      title: "Oath of Undertaking - First Time Job Seeker",
      images: [firstTimeJobseekerOath],
      description:
        "Oath form required for first-time jobseekers availing benefits under RA 11261.",
      uploadLabel: "Upload Valid ID / Proof of Residency",
      fields: [
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required: true,
        },
        {
          name: "age",
          label: "Age",
          type: "number",
          placeholder: "Enter your age",
          required: true,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter your complete address",
          required: true,
        },
        {
          name: "years_residing",
          label: "Years Residing",
          type: "number",
          placeholder: "Example: 5",
          required: true,
        },
      ],
    },
  ],
  fields: [],
},

    "Barangay Certification": {
      id: 6,
      category: "Barangay",
      fee: "₱30.00",
      time: "1 working day",
      images: [barangayCertification],
      description:
        "A general barangay certification issued for school, scholarship, employment, or other legal purposes.",
      uploadLabel: "Upload Valid ID / Supporting Document",
      fields: [
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter your complete address",
          required,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Scholarship, school requirement",
          required,
        },
      ],
    },

    "Barangay Certification - Residency": {
      id: 7,
      category: "Barangay",
      fee: "₱30.00",
      time: "1 working day",
      images: [barangayCertificationResidency],
      description:
        "A barangay certification confirming the applicant's residency in the barangay.",
      uploadLabel: "Upload Valid ID / Proof of Address",
      fields: [
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter your complete address",
          required,
        },
        {
          name: "years_residing",
          label: "Years Residing",
          type: "number",
          placeholder: "Example: 5",
          required,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Requirement, school, work",
          required,
        },
      ],
    },

    "Certificate of Attestation": {
      id: 8,
      category: "Barangay",
      fee: "Free",
      time: "1–2 working days",
      images: [certificateOfAttestation],
      description:
        "A certificate attesting to the applicant's socio-economic condition or other verified barangay information.",
      uploadLabel: "Upload Valid ID / Supporting Proof",
      fields: [
        {
          name: "full_name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter your complete address",
          required,
        },
        {
          name: "monthly_income",
          label: "Monthly Income",
          type: "number",
          placeholder: "Example: 5000",
          required,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Financial assistance, medical assistance",
          required,
        },
      ],
    },

    "Application of Marriage License": {
      id: 5,
      category: "LGU",
      fee: "Varies",
      time: "3–10 working days",
      images: [marriageLicense],
      description:
        "This form is used by applicants applying for a marriage license through the Local Civil Registrar.",
      uploadLabel: "Upload Valid IDs / Birth Certificates / CENOMAR",
      fields: [
        {
          name: "applicant_name",
          label: "Applicant Full Name",
          type: "text",
          placeholder: "Enter applicant name",
          required,
        },
        {
          name: "partner_name",
          label: "Partner Full Name",
          type: "text",
          placeholder: "Enter partner name",
          required,
        },
        {
          name: "birth_date",
          label: "Applicant Date of Birth",
          type: "date",
          required,
        },
        {
          name: "partner_birth_date",
          label: "Partner Date of Birth",
          type: "date",
          required,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter complete address",
          required,
        },
      ],
    },

    "Certificate of Death": {
      id: 11,
      category: "LGU",
      fee: "Varies",
      time: "3–7 working days",
      images: [deathCert1, deathCert2],
      description:
        "This document is used for requesting or processing death certificate records.",
      uploadLabel: "Upload Valid ID / Supporting Death Record",
      fields: [
        {
          name: "requester_name",
          label: "Requester Full Name",
          type: "text",
          placeholder: "Enter requester name",
          required,
        },
        {
          name: "deceased_name",
          label: "Deceased Full Name",
          type: "text",
          placeholder: "Enter deceased name",
          required,
        },
        {
          name: "date_of_death",
          label: "Date of Death",
          type: "date",
          required,
        },
        {
          name: "relationship",
          label: "Relationship to Deceased",
          type: "text",
          placeholder: "Example: Son, Daughter, Spouse",
          required,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Claim, legal, record copy",
          required,
        },
      ],
    },

    "Certificate of Fetal Death": {
      id: 13,
      category: "LGU",
      fee: "Varies",
      time: "3–7 working days",
      images: [fetalDeath1, fetalDeath2],
      description:
        "This form is used for registration or request of fetal death records.",
      uploadLabel: "Upload Valid ID / Medical or Hospital Record",
      fields: [
        {
          name: "requester_name",
          label: "Requester Full Name",
          type: "text",
          placeholder: "Enter requester name",
          required,
        },
        {
          name: "mother_name",
          label: "Mother's Full Name",
          type: "text",
          placeholder: "Enter mother's name",
          required,
        },
        {
          name: "father_name",
          label: "Father's Full Name",
          type: "text",
          placeholder: "Enter father's name",
          required: optional,
        },
        {
          name: "date_of_fetal_death",
          label: "Date of Fetal Death",
          type: "date",
          required,
        },
        {
          name: "hospital_name",
          label: "Hospital / Clinic Name",
          type: "text",
          placeholder: "Enter hospital or clinic",
          required,
        },
      ],
    },

    "Certificate of Marriage": {
      id: 15,
      category: "LGU",
      fee: "Varies",
      time: "3–7 working days",
      images: [marriageCert1, marriageCert2],
      description:
        "This document is used for requesting or processing marriage certificate records.",
      uploadLabel: "Upload Valid ID / Marriage Supporting Document",
      fields: [
        {
          name: "requester_name",
          label: "Requester Full Name",
          type: "text",
          placeholder: "Enter requester name",
          required,
        },
        {
          name: "husband_name",
          label: "Husband's Full Name",
          type: "text",
          placeholder: "Enter husband's name",
          required,
        },
        {
          name: "wife_name",
          label: "Wife's Full Name",
          type: "text",
          placeholder: "Enter wife's name",
          required,
        },
        {
          name: "marriage_date",
          label: "Date of Marriage",
          type: "date",
          required,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Record copy, legal, travel",
          required,
        },
      ],
    },

    "LGU Map": {
      id: 17,
      category: "LGU",
      fee: "Varies",
      time: "1–3 working days",
      images: [lguMap],
      description:
        "This document is used for LGU map-related requests, references, or local government documentation.",
      uploadLabel: "Upload Valid ID / Request Purpose Document",
      fields: [
        {
          name: "requester_name",
          label: "Requester Full Name",
          type: "text",
          placeholder: "Enter requester name",
          required,
        },
        {
          name: "purpose",
          label: "Request Purpose",
          type: "text",
          placeholder: "Example: Reference, property, planning",
          required,
        },
      ],
    },

    "No Real Property Unit": {
      id: 18,
      category: "LGU",
      fee: "Varies",
      time: "3–5 working days",
      images: [noRealProperty],
      description:
        "This document may be used to certify that a person has no real property record under the local assessment office.",
      uploadLabel: "Upload Valid ID / Property Record Details",
      fields: [
        {
          name: "requester_name",
          label: "Requester Full Name",
          type: "text",
          placeholder: "Enter requester name",
          required,
        },
        {
          name: "address",
          label: "Complete Address",
          type: "text",
          placeholder: "Enter complete address",
          required,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Requirement, verification, legal",
          required,
        },
      ],
    },


    "Notice of Assessment": {
      id: 19,
      category: "LGU",
      fee: "Varies",
      time: "3–5 working days",
      images: [noticeAssessment],
      description:
        "This document is related to assessment notices and may be used for property, payment, or Land Bank processing.",
      uploadLabel: "Upload Valid ID / Property or Assessment Details",
      fields: [
        {
          name: "requester_name",
          label: "Requester Full Name",
          type: "text",
          placeholder: "Enter requester name",
          required,
        },
        {
          name: "property_owner",
          label: "Property Owner Name",
          type: "text",
          placeholder: "Enter property owner name",
          required,
        },
        {
          name: "assessment_no",
          label: "Assessment Number",
          type: "text",
          placeholder: "Enter assessment number if available",
          required: optional,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Land Bank processing, payment, records",
          required,
        },
      ],
    },

    "Real Property Appraisal Sheet": {
      id: 20,
      category: "LGU",
      fee: "Varies",
      time: "5–10 working days",
      images: [realProperty1, realProperty2],
      description:
        "This document is used for real property field appraisal and assessment.",
      uploadLabel: "Upload Property Document / Tax Declaration",
      fields: [
        {
          name: "owner_name",
          label: "Property Owner Name",
          type: "text",
          placeholder: "Enter property owner name",
          required,
        },
        {
          name: "property_location",
          label: "Property Location",
          type: "text",
          placeholder: "Enter property location",
          required,
        },
        {
          name: "tax_declaration_no",
          label: "Tax Declaration Number",
          type: "text",
          placeholder: "Enter tax declaration number",
          required: optional,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: Assessment, transfer, update",
          required,
        },
      ],
    },

    "Residential or Agricultural Land": {
      id: 22,
      category: "LGU",
      fee: "Varies",
      time: "5–10 working days",
      images: [residentialAgriLand],
      description:
        "This form is used for residential or agricultural land assessment and local property documentation.",
      uploadLabel: "Upload Land Title / Tax Declaration / Valid ID",
      fields: [
        {
          name: "owner_name",
          label: "Land Owner Name",
          type: "text",
          placeholder: "Enter land owner name",
          required,
        },
        {
          name: "land_location",
          label: "Land Location",
          type: "text",
          placeholder: "Enter land location",
          required,
        },
        {
          name: "land_type",
          label: "Land Type",
          type: "text",
          placeholder: "Residential or Agricultural",
          required,
        },
        {
          name: "tax_declaration_no",
          label: "Tax Declaration Number",
          type: "text",
          placeholder: "Enter tax declaration number",
          required: optional,
        },
      ],
    },

    "Tax Declaration of Real Property": {
      id: 23,
      category: "LGU",
      fee: "Varies",
      time: "5–10 working days",
      images: [taxDeclaration],
      description:
        "This document is used for requesting, updating, or processing a tax declaration of real property.",
      uploadLabel: "Upload Property Documents / Previous Tax Declaration",
      fields: [
        {
          name: "owner_name",
          label: "Property Owner Name",
          type: "text",
          placeholder: "Enter property owner name",
          required,
        },
        {
          name: "property_location",
          label: "Property Location",
          type: "text",
          placeholder: "Enter property location",
          required,
        },
        {
          name: "previous_tax_declaration",
          label: "Previous Tax Declaration No.",
          type: "text",
          placeholder: "Enter previous tax declaration number",
          required: optional,
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "text",
          placeholder: "Example: New request, update, transfer",
          required,
        },
      ],
    },
  };