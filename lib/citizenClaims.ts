/**
 * Citizen Claims & Tailored Counter-Defense Stances Configuration
 * Synchronized with backend/utils/citizenClaims.utils.js
 */

export interface ClaimOption {
  id: string;
  text: string;
  isRecommended?: boolean;
}

export interface CitizenClaimDetail {
  key: string;
  forWhat: "reportSpot" | "reportCompleteSpot";
  title: string;
  claimLabel: string;
  citizenDesc: string;
  recommendedRebuttal: string;
  options: ClaimOption[];
  quickChips: string[];
}

export const CITIZEN_SPOT_CLAIMS: Record<string, CitizenClaimDetail> = {
  inaccessible: {
    key: "inaccessible",
    forWhat: "reportSpot",
    title: "Inaccessible or Hazardous Area",
    claimLabel: "Inaccessible or Private Location",
    citizenDesc: "Private property, gated zone, or physically dangerous site",
    recommendedRebuttal: "Spot is publicly accessible along the civic path, not private property",
    options: [
      {
        id: "public_path_open",
        text: "Spot is publicly accessible along the civic path, not private property",
        isRecommended: true,
      },
      {
        id: "no_private_gates",
        text: "Public access path is fully open with no private gates or locked barriers",
      },
      {
        id: "safe_staff_access",
        text: "Sanitation staff and vehicles can safely reach the waste without hazards",
      },
      {
        id: "municipal_roadway",
        text: "Waste is placed along the public municipal roadway or sidewalk",
      },
      {
        id: "regular_hours_access",
        text: "Accessible via public thoroughfare during regular sanitation hours",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "Public path is open",
      "No private gates",
      "Clear road access",
      "Sanitation staff can reach",
      "Sidewalk accessible",
    ],
  },

  fake_or_ai: {
    key: "fake_or_ai",
    forWhat: "reportSpot",
    title: "AI Generated or Fake Photo",
    claimLabel: "AI Generated or Fake Photo",
    citizenDesc: "Photo is fabricated, AI generated, or stock image from internet",
    recommendedRebuttal: "Photo is 100% genuine and taken live on-site (not AI or fake)",
    options: [
      {
        id: "genuine_live_photo",
        text: "Photo is 100% genuine and taken live on-site (not AI or fake)",
        isRecommended: true,
      },
      {
        id: "real_landmarks_visible",
        text: "Captured in real-time showing authentic background street landmarks",
      },
      {
        id: "unedited_camera_shot",
        text: "Original unedited camera shot of actual physical waste pile",
      },
      {
        id: "timestamp_geotag_valid",
        text: "Camera timestamp and GPS coordinates verify real-time site capture",
      },
      {
        id: "liveness_verified",
        text: "Passed device camera verification at the time of reporting",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "Photo taken live on-site",
      "Unedited camera capture",
      "Surrounding landmarks visible",
      "Real daylight lighting",
      "Authentic waste pile",
    ],
  },

  already_cleaned: {
    key: "already_cleaned",
    forWhat: "reportSpot",
    title: "Already Clean / No Waste Found",
    claimLabel: "Already Cleaned Beforehand",
    citizenDesc: "Area is clean; no waste or debris exists at this location",
    recommendedRebuttal: "Waste was present on-site; was not cleaned beforehand",
    options: [
      {
        id: "waste_present_on_arrival",
        text: "Waste was present on-site; was not cleaned beforehand",
        isRecommended: true,
      },
      {
        id: "garbage_accumulated",
        text: "Garbage pile was visibly accumulated when the report was submitted",
      },
      {
        id: "cleared_after_report",
        text: "Area may have been cleaned by municipality after my report was lodged",
      },
      {
        id: "waste_in_boundary",
        text: "Debris is located within the designated radius, possibly obscured by recent movement",
      },
      {
        id: "actively_littered",
        text: "Site was untended and actively accumulating litter at time of documentation",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "Waste was visible on arrival",
      "Garbage pile present",
      "Condition matches photo",
      "Cleaned after report",
      "Active litter zone",
    ],
  },

  wrong_location: {
    key: "wrong_location",
    forWhat: "reportSpot",
    title: "Incorrect Location / Coordinates",
    claimLabel: "Inaccurate Coordinates / Wrong Location",
    citizenDesc: "GPS coordinates or pin do not match the real spot location",
    recommendedRebuttal: "GPS pin and coordinates accurately mark the spot",
    options: [
      {
        id: "pin_accurately_marks",
        text: "GPS pin and coordinates accurately mark the spot",
        isRecommended: true,
      },
      {
        id: "landmarks_align_coords",
        text: "Street names, house numbers, and landmarks in photo correspond to pinned coords",
      },
      {
        id: "rtk_gnss_accurate",
        text: "Coordinates captured via high-precision device GNSS with accurate positioning",
      },
      {
        id: "within_tolerance",
        text: "Location pin is within a few meters of the actual physical waste pile",
      },
      {
        id: "verified_on_map",
        text: "Verified on interactive map before submitting the report",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "GPS pin matches waste pile",
      "Exact coordinates verified",
      "Street landmarks align",
      "Within 3m accuracy",
      "Map pin confirmed",
    ],
  },

  other_spam: {
    key: "other_spam",
    forWhat: "reportSpot",
    title: "Other Policy Violation / Spam",
    claimLabel: "Spam or Invalid Content",
    citizenDesc: "Duplicate report, spam, or inappropriate content",
    recommendedRebuttal: "Authentic civic report, not spam or fake contest",
    options: [
      {
        id: "authentic_civic_report",
        text: "Authentic civic report, not spam or fake contest",
        isRecommended: true,
      },
      {
        id: "good_faith_submission",
        text: "Reported in good faith to resolve a genuine sanitation concern",
      },
      {
        id: "requires_municipal_action",
        text: "Legitimate civic issue requiring municipal waste management attention",
      },
      {
        id: "follows_guidelines",
        text: "Complies with all SafaiWatch community reporting standards and public cleanliness rules",
      },
      {
        id: "unique_incident",
        text: "Unique incident documenting a real littering issue in the neighborhood",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "Inspected spot in person",
      "Legitimate report in good faith",
      "Photo reflects site condition",
      "Community cleanliness concern",
      "Follows civic rules",
    ],
  },
};

export const CITIZEN_CLEANUP_CLAIMS: Record<string, CitizenClaimDetail> = {
  not_completed: {
    key: "not_completed",
    forWhat: "reportCompleteSpot",
    title: "Cleanup Incomplete or Not Cleaned",
    claimLabel: "Cleanup Incomplete or Not Cleaned",
    citizenDesc: "Waste was not fully removed or garbage remains on the premises",
    recommendedRebuttal: "Waste was thoroughly cleared and removed from the site as required",
    options: [
      {
        id: "waste_thoroughly_cleared",
        text: "Waste was thoroughly cleared and removed from the site as required",
        isRecommended: true,
      },
      {
        id: "hauled_to_disposal",
        text: "All bagged debris and loose litter were hauled away to the disposal center",
      },
      {
        id: "swept_and_sanitized",
        text: "Area was swept clean; new garbage may have been dumped after completion",
      },
      {
        id: "ground_completely_clear",
        text: "Verified the ground was completely clear before submitting completed proof",
      },
      {
        id: "coordinator_protocol",
        text: "Full cleanup protocol executed per assigned coordinator guidelines",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "Waste was 100% bagged and removed",
      "Area swept clean",
      "Disposed at dump facility",
      "New dumping after cleanup",
      "Coordinator verified",
    ],
  },

  fake_or_ai: {
    key: "fake_or_ai",
    forWhat: "reportCompleteSpot",
    title: "AI Generated or Fake Cleanup Photo",
    claimLabel: "AI Generated or Fake Photo",
    citizenDesc: "Cleanup photo is fabricated, AI generated, or borrowed",
    recommendedRebuttal: "Cleanup photo was taken live on-site right after work was finished",
    options: [
      {
        id: "taken_live_after_work",
        text: "Cleanup photo was taken live on-site right after work was finished",
        isRecommended: true,
      },
      {
        id: "live_camera_proof",
        text: "Live camera capture showing clean area and verified post-work condition",
      },
      {
        id: "landmarks_confirm_after",
        text: "Real background landmarks confirm genuine post-cleanup condition",
      },
      {
        id: "unedited_photograph",
        text: "Unedited photograph documenting authentic completed sanitation work",
      },
      {
        id: "liveness_verified_cleanup",
        text: "Validated with on-site paper verification code and GPS telemetry",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "Photo taken live on-site",
      "Unedited cleanup capture",
      "Background landmarks match",
      "Paper code in viewfinder",
      "Authentic finished work",
    ],
  },

  wrong_cleaned_location: {
    key: "wrong_cleaned_location",
    forWhat: "reportCompleteSpot",
    title: "Wrong Cleanup Location",
    claimLabel: "Wrong Cleanup Location",
    citizenDesc: "Cleaned a different area than the assigned coordinates",
    recommendedRebuttal: "Cleaned at the exact coordinates of the assigned spot",
    options: [
      {
        id: "exact_assigned_coords",
        text: "Cleaned at the exact coordinates of the assigned spot",
        isRecommended: true,
      },
      {
        id: "landmarks_match_original",
        text: "Coordinates and landmarks in after-photo match the original report location",
      },
      {
        id: "followed_navigation",
        text: "Followed GPS navigation directly to the assigned waste pile",
      },
      {
        id: "designated_sector",
        text: "Cleaned the exact designated municipal sector assigned to me",
      },
      {
        id: "pin_confirmed_before_cleaning",
        text: "Map pin and on-site visual checks confirmed target site before cleaning",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "Cleaned exact assigned spot",
      "Coordinates match assignment",
      "Landmarks in photo align",
      "GPS followed to site",
      "Designated municipal zone",
    ],
  },

  other_spam: {
    key: "other_spam",
    forWhat: "reportCompleteSpot",
    title: "Other Policy Violation / Spam",
    claimLabel: "Spam or Invalid Content",
    citizenDesc: "Fraudulent cleanup dispute or invalid contestation",
    recommendedRebuttal: "Authentic cleanup executed in good faith per civic standards",
    options: [
      {
        id: "authentic_cleanup_good_faith",
        text: "Authentic cleanup executed in good faith per civic standards",
        isRecommended: true,
      },
      {
        id: "volunteer_coordinator_rules",
        text: "Legitimate cleanup completed by volunteer/coordinator in accordance with rules",
      },
      {
        id: "proper_sanitation_followed",
        text: "Proper sanitation process followed with genuine visual evidence",
      },
      {
        id: "valid_task_resolution",
        text: "Valid task resolution, not a duplicate or fraudulent submission",
      },
      {
        id: "custom_explanation",
        text: "Other custom explanation",
      },
    ],
    quickChips: [
      "Authentic cleanup executed",
      "Good faith sanitation",
      "Rules followed",
      "Valid task resolution",
    ],
  },
};

export const getCitizenClaimDefinition = (
  reasonKey?: string | null,
  forWhat?: string
): CitizenClaimDetail => {
  if (forWhat === "reportCompleteSpot") {
    if (reasonKey && CITIZEN_CLEANUP_CLAIMS[reasonKey]) {
      return CITIZEN_CLEANUP_CLAIMS[reasonKey];
    }
    return CITIZEN_CLEANUP_CLAIMS.other_spam;
  }
  if (reasonKey && CITIZEN_SPOT_CLAIMS[reasonKey]) {
    return CITIZEN_SPOT_CLAIMS[reasonKey];
  }
  return CITIZEN_SPOT_CLAIMS.other_spam;
};

export const getCustomOptionsForClaim = (
  reasonKey?: string | null,
  forWhat?: string
): ClaimOption[] => {
  const claim = getCitizenClaimDefinition(reasonKey, forWhat);
  return claim.options;
};

export const getQuickChipsForClaim = (
  reasonKey?: string | null,
  forWhat?: string
): string[] => {
  const claim = getCitizenClaimDefinition(reasonKey, forWhat);
  return claim.quickChips;
};
