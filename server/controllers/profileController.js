const path = require("path");
const db = require("../config/db");
const {
  MINIMUM_CITIZEN_AGE,
  getAge,
  getLatestAllowedBirthDate,
  isAtLeastAge,
  isValidBirthDate,
} = require("../utils/ageValidation");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const REQUIRED_FIELDS = [
  "date_of_birth",
  "gender",
  "mobile_number",
  "province",
  "city_municipality",
  "barangay",
  "street_purok_sitio",
  "occupation_type",
];

const allowedGender = ["Male", "Female", "Prefer not to say"];
const allowedCivilStatus = ["Single", "Married", "Widowed", "Separated"];
const allowedOccupationType = [
  "Student",
  "Employed",
  "Self-employed",
  "Unemployed",
  "Senior Citizen",
  "PWD",
  "Other",
];
const allowedValidIdType = [
  "School ID",
  "National ID",
  "Driver License",
  "Passport",
  "Voter ID",
  "Barangay ID",
  "Other",
];

const cleanText = (value) => {
  return String(value || "").trim();
};

const nullIfEmpty = (value) => {
  const cleanedValue = cleanText(value);
  return cleanedValue === "" ? null : cleanedValue;
};

const cleanEnum = (value, allowedValues) => {
  const cleanedValue = cleanText(value);
  return allowedValues.includes(cleanedValue) ? cleanedValue : null;
};

const normalizeDbDate = (value) => {
  if (!value) return "";

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return String(value).slice(0, 10);
};

const normalizePath = (file) => {
  if (!file) return null;

  if (file.filename) {
    return `uploads/${file.filename}`;
  }

  const rawPath = String(file.path || "").replaceAll("\\", "/");
  const uploadsIndex = rawPath.indexOf("uploads/");

  if (uploadsIndex !== -1) {
    return rawPath.substring(uploadsIndex);
  }

  return rawPath;
};

const getFileNameFromPath = (filePath) => {
  if (!filePath) return "";
  return path.basename(String(filePath));
};

const buildCompleteAddress = (profile) => {
  const addressParts = [
    profile.house_number,
    profile.street_purok_sitio,
    profile.barangay,
    profile.city_municipality,
    profile.province,
  ].filter((item) => item && String(item).trim() !== "");

  return addressParts.join(", ");
};

const getMissingFields = (profile) => {
  return REQUIRED_FIELDS.filter((field) => {
    return !profile[field] || String(profile[field]).trim() === "";
  });
};

const computeVerificationStatus = (profile) => {
  const dateOfBirth = normalizeDbDate(profile.date_of_birth);
  const missingFields = getMissingFields({ ...profile, date_of_birth: dateOfBirth });

  if (missingFields.length > 0) {
    return "Not Verified";
  }

  if (!isValidBirthDate(dateOfBirth)) {
    return "Not Verified";
  }

  if (!isAtLeastAge(dateOfBirth, MINIMUM_CITIZEN_AGE)) {
    return "Not Verified";
  }

  return "Fully Verified";
};

const formatProfileResponse = (profile) => {
  const dateOfBirth = normalizeDbDate(profile?.date_of_birth);
  const age = dateOfBirth ? getAge(dateOfBirth) : null;
  const ageEligible = dateOfBirth
    ? isAtLeastAge(dateOfBirth, MINIMUM_CITIZEN_AGE)
    : false;

  return {
    id: profile?.id || null,
    user_id: profile?.user_id || null,
    date_of_birth: dateOfBirth,
    gender: profile?.gender || "",
    civil_status: profile?.civil_status || "",
    mobile_number: profile?.mobile_number || "",
    province: profile?.province || "",
    city_municipality: profile?.city_municipality || "",
    barangay: profile?.barangay || "",
    street_purok_sitio: profile?.street_purok_sitio || "",
    house_number: profile?.house_number || "",
    complete_address: profile?.complete_address || "",
    occupation_type: profile?.occupation_type || "",
    school_company_name: profile?.school_company_name || "",
    valid_id_type: profile?.valid_id_type || "",
    valid_id_number: profile?.valid_id_number || "",
    valid_id_path: profile?.valid_id_path || "",
    valid_id_file_name: getFileNameFromPath(profile?.valid_id_path),
    emergency_contact_name: profile?.emergency_contact_name || "",
    emergency_contact_number: profile?.emergency_contact_number || "",
    verification_status: profile?.verification_status || "Not Verified",
    age,
    age_eligible: ageEligible,
    minimum_age: MINIMUM_CITIZEN_AGE,
    latest_allowed_birth_date: getLatestAllowedBirthDate(MINIMUM_CITIZEN_AGE),
    missing_fields: getMissingFields({ ...profile, date_of_birth: dateOfBirth }),
  };
};

const getProfileByUserId = async (userId) => {
  const rows = await query(
    `SELECT *
     FROM citizen_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

exports.getMyProfile = async (req, res) => {
  try {
    if (req.user.role !== "citizen") {
      return res.status(403).json({
        message: "Only citizen accounts can access citizen profile verification.",
      });
    }

    const userId = req.user.id;
    const profile = await getProfileByUserId(userId);

    if (!profile) {
      return res.status(200).json({
        message: "Citizen profile has not been created yet.",
        profile: formatProfileResponse({
          user_id: userId,
          verification_status: "Not Verified",
        }),
      });
    }

    const finalStatus = computeVerificationStatus(profile);

    if (profile.verification_status !== finalStatus) {
      await query(
        `UPDATE citizen_profiles
         SET verification_status = ?
         WHERE user_id = ?`,
        [finalStatus, userId]
      );

      profile.verification_status = finalStatus;
    }

    return res.status(200).json({
      message: "Citizen profile loaded.",
      profile: formatProfileResponse(profile),
    });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);

    return res.status(500).json({
      message: "Database error while loading profile.",
      error: err.message,
    });
  }
};

exports.saveMyProfile = async (req, res) => {
  try {
    if (req.user.role !== "citizen") {
      return res.status(403).json({
        message: "Only citizen accounts can update citizen profile verification.",
      });
    }

    const userId = req.user.id;
    const existingProfile = await getProfileByUserId(userId);
    const uploadedValidIdPath = normalizePath(req.file);

    const dateOfBirth = nullIfEmpty(req.body.date_of_birth);

    if (dateOfBirth && !isValidBirthDate(dateOfBirth)) {
      return res.status(400).json({
        message: "Please enter a valid date of birth.",
      });
    }

    if (dateOfBirth && !isAtLeastAge(dateOfBirth, MINIMUM_CITIZEN_AGE)) {
      return res.status(400).json({
        message:
          "Minimum age requirement is 18 years old. The profile cannot be verified because the citizen is below 18.",
      });
    }

    const profilePayload = {
      user_id: userId,
      date_of_birth: dateOfBirth,
      gender: cleanEnum(req.body.gender, allowedGender),
      civil_status: cleanEnum(req.body.civil_status, allowedCivilStatus),
      mobile_number: nullIfEmpty(req.body.mobile_number),
      province: nullIfEmpty(req.body.province),
      city_municipality: nullIfEmpty(req.body.city_municipality),
      barangay: nullIfEmpty(req.body.barangay),
      street_purok_sitio: nullIfEmpty(req.body.street_purok_sitio),
      house_number: nullIfEmpty(req.body.house_number),
      complete_address: nullIfEmpty(req.body.complete_address),
      occupation_type: cleanEnum(req.body.occupation_type, allowedOccupationType),
      school_company_name: nullIfEmpty(req.body.school_company_name),
      valid_id_type: cleanEnum(req.body.valid_id_type, allowedValidIdType),
      valid_id_number: nullIfEmpty(req.body.valid_id_number),
      valid_id_path: uploadedValidIdPath || existingProfile?.valid_id_path || null,
      emergency_contact_name: nullIfEmpty(req.body.emergency_contact_name),
      emergency_contact_number: nullIfEmpty(req.body.emergency_contact_number),
    };

    profilePayload.complete_address =
      profilePayload.complete_address || buildCompleteAddress(profilePayload);

    profilePayload.verification_status = computeVerificationStatus(profilePayload);

    if (existingProfile) {
      await query(
        `UPDATE citizen_profiles
         SET date_of_birth = ?,
             gender = ?,
             civil_status = ?,
             mobile_number = ?,
             province = ?,
             city_municipality = ?,
             barangay = ?,
             street_purok_sitio = ?,
             house_number = ?,
             complete_address = ?,
             occupation_type = ?,
             school_company_name = ?,
             valid_id_type = ?,
             valid_id_number = ?,
             valid_id_path = ?,
             emergency_contact_name = ?,
             emergency_contact_number = ?,
             verification_status = ?
         WHERE user_id = ?`,
        [
          profilePayload.date_of_birth,
          profilePayload.gender,
          profilePayload.civil_status,
          profilePayload.mobile_number,
          profilePayload.province,
          profilePayload.city_municipality,
          profilePayload.barangay,
          profilePayload.street_purok_sitio,
          profilePayload.house_number,
          profilePayload.complete_address,
          profilePayload.occupation_type,
          profilePayload.school_company_name,
          profilePayload.valid_id_type,
          profilePayload.valid_id_number,
          profilePayload.valid_id_path,
          profilePayload.emergency_contact_name,
          profilePayload.emergency_contact_number,
          profilePayload.verification_status,
          userId,
        ]
      );
    } else {
      await query(
        `INSERT INTO citizen_profiles
         (
           user_id,
           date_of_birth,
           gender,
           civil_status,
           mobile_number,
           province,
           city_municipality,
           barangay,
           street_purok_sitio,
           house_number,
           complete_address,
           occupation_type,
           school_company_name,
           valid_id_type,
           valid_id_number,
           valid_id_path,
           emergency_contact_name,
           emergency_contact_number,
           verification_status
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profilePayload.user_id,
          profilePayload.date_of_birth,
          profilePayload.gender,
          profilePayload.civil_status,
          profilePayload.mobile_number,
          profilePayload.province,
          profilePayload.city_municipality,
          profilePayload.barangay,
          profilePayload.street_purok_sitio,
          profilePayload.house_number,
          profilePayload.complete_address,
          profilePayload.occupation_type,
          profilePayload.school_company_name,
          profilePayload.valid_id_type,
          profilePayload.valid_id_number,
          profilePayload.valid_id_path,
          profilePayload.emergency_contact_name,
          profilePayload.emergency_contact_number,
          profilePayload.verification_status,
        ]
      );
    }

    const savedProfile = await getProfileByUserId(userId);
    const formattedProfile = formatProfileResponse(savedProfile);

    return res.status(200).json({
      message:
        formattedProfile.verification_status === "Fully Verified"
          ? "Profile saved. Your account is now Fully Verified."
          : "Profile saved. Please complete all required fields before requesting documents.",
      profile: formattedProfile,
    });
  } catch (err) {
    console.error("SAVE PROFILE ERROR:", err);

    return res.status(500).json({
      message: "Database error while saving profile.",
      error: err.message,
    });
  }
};
