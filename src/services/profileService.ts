import { getProfile } from "./userService";
import { getTutorProfile } from "./v1Service";
import { getCompanyProfile } from "./v2Service";

export const getProfileByRole = async (
  role: string
) => {
  switch (role) {
    case "student":
      return await getProfile();

    case "tutor":
      return await getTutorProfile();

    case "company": {
        const profile = await getCompanyProfile();

        return {
            success: true,
            user: {
            id: profile.data.id,
            display_name: profile.data.company_name,
            email: profile.data.email,
            phone: profile.data.phone,
            role: "company",

            // keep the whole company profile here
            profile: profile.data,
            },
        };
        }

    case "admin":
      return {
        success: true,
        user: {
          role: "admin",
        },
      };

    default:
      throw new Error("Unknown user role.");
  }
};