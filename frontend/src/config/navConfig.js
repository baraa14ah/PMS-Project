import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";

/**
 * عناصر السايدبار حسب الدور — لا يُعرض ما لا يستخدمه الدور.
 * roles: student | supervisor | admin | super_admin
 */
export const NAV_ITEMS = [
  {
    id: "home",
    labelKey: "nav.home",
    to: "/dashboard",
    icon: HomeRoundedIcon,
    roles: ["student", "supervisor", "admin", "super_admin"],
    end: true,
  },
  {
    id: "projects",
    labelKey: "nav.projects",
    labelKeySuper: "nav.allProjects",
    to: "/dashboard/projects",
    icon: FolderRoundedIcon,
    roles: ["student", "supervisor", "admin", "super_admin"],
  },
  {
    id: "notifications",
    labelKey: "nav.notifications",
    to: "/dashboard/notifications",
    icon: NotificationsRoundedIcon,
    roles: ["student", "supervisor", "admin", "super_admin"],
    badgeKey: "unread",
  },
  {
    id: "supervisor_invitations",
    labelKey: "nav.supervisorInvitations",
    to: "/dashboard/supervisor/invitations",
    icon: SupervisorAccountRoundedIcon,
    roles: ["supervisor", "admin"],
    badgeKey: "supervisorInv",
  },
  {
    id: "student_invitations",
    labelKey: "nav.studentInvitations",
    to: "/dashboard/student/invitations",
    icon: PersonAddAltRoundedIcon,
    roles: ["student", "admin"],
    badgeKey: "studentInv",
  },
  {
    id: "users",
    labelKey: "nav.usersManagement",
    labelKeySuper: "nav.users",
    to: "/dashboard/users",
    icon: GroupRoundedIcon,
    roles: ["admin", "super_admin"],
    badgeKey: "passwordReset",
  },
  {
    id: "universities",
    labelKey: "nav.universities",
    to: "/dashboard/universities",
    icon: SchoolRoundedIcon,
    roles: ["super_admin"],
  },
  {
    id: "profile",
    labelKey: "nav.profile",
    to: "/dashboard/profile",
    icon: AccountCircleRoundedIcon,
    roles: ["student", "supervisor", "admin"],
  },
];

export function getNavForRole(roleName) {
  const role = String(roleName || "").toLowerCase();
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
