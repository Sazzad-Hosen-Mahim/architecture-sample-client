import { Fragment, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppSelector } from "@/hooks/useRedux";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { getUserPhoto } from "@/utils/userPhoto";

export type AvatarMenuAction = {
  key: string;
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
  /** Red hover treatment + a divider above it (e.g. Logout). */
  danger?: boolean;
};

type AvatarMenuProps = {
  actions: AvatarMenuAction[];
  align?: "start" | "center" | "end";
  /** Override the trigger avatar size, default `h-9 w-9`. */
  avatarClassName?: string;
};

/**
 * The signed-in user's avatar + dropdown, shared by every navbar so the menu
 * looks identical on the public site, the client dashboard and the studio
 * dashboard — on desktop and mobile alike.
 *
 * Controlled + closes on route change: the client dashboard lives under the
 * same layout as the public navbar, so nothing else would close it after you
 * navigate there.
 */
export default function AvatarMenu({
  actions,
  align = "end",
  avatarClassName = "h-9 w-9",
}: AvatarMenuProps) {
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const photo = getUserPhoto(user);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="cursor-pointer">
        <div
          className={`${avatarClassName} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700`}
        >
          {photo ? (
            <img
              src={photo}
              alt={user?.name || "Account"}
              className="h-full w-full object-cover"
            />
          ) : (
            user?.name?.charAt(0)?.toUpperCase() || "U"
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={10}
        className="w-60 mr-3 p-2 rounded-2xl border border-gray-300 bg-white backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,2,0.35)] text-black z-[60]"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Fragment key={action.key}>
              {action.danger && <div className="h-px bg-white/10" />}
              <button
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={`group w-full flex items-center gap-3 px-2 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                  action.danger
                    ? "hover:bg-red-500/10"
                    : "hover:bg-green-300/30"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center bg-white/10 border border-gray-300 transition-all duration-200 ${
                    action.danger
                      ? " group-hover:bg-red-500 group-hover:text-white"
                      : "text-black group-hover:bg-green-300"
                  }`}
                >
                  <Icon size={16} />
                </div>

                <div className="flex-1">
                  <p
                    className={`text-sm font-medium text-black ${
                      action.danger ? "group-hover:text-red-400" : ""
                    }`}
                  >
                    {action.label}
                  </p>
                  <p className="text-[11px] text-black">{action.description}</p>
                </div>

                {!action.danger && (
                  <ChevronRight
                    size={15}
                    className="text-white/30 transition-all duration-200 group-hover:text-black group-hover:translate-x-0.5"
                  />
                )}
              </button>
            </Fragment>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
