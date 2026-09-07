import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Trash2, Check, X } from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  useAcceptProjectMutation,
  useRejectProjectMutation,
  useMarkAllAsReadMutation,
} from "@/redux/api/notificationApi";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const NotificationPopover = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [acceptProject] = useAcceptProjectMutation();
  const [rejectProject] = useRejectProjectMutation();

  // Once the decision is made the prompt has done its job, so it is removed
  // rather than left in the list as a card with nothing left to do. Deleting is
  // best-effort: the decision itself already succeeded, and failing to tidy up
  // afterwards is not worth reporting as a failed accept.
  const dismissAfterDecision = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
    } catch {
      /* leaves the notification in place, now marked read by the server */
    }
  };

  const handleAccept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await acceptProject(id).unwrap();
      toast.success("Project accepted successfully");
      await dismissAfterDecision(id);
    } catch (err) {
      toast.error("Failed to accept project");
    }
  };

  const handleReject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await rejectProject(id).unwrap();
      toast.success("Project rejected");
      await dismissAfterDecision(id);
    } catch (err) {
      toast.error("Failed to reject project");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id).unwrap();
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  /**
   * A notification whose buttons are still waiting on a decision.
   *
   * The Accept / Reject pair is hidden once the notification is read, and the
   * server marks every notification for a project read as soon as anyone
   * decides it — that is what stops a second manager acting on a request that
   * is already settled. The trouble was that simply *opening* a notification
   * marked it read too, so the buttons vanished on a plain click and it looked
   * as though clicking the body had accepted the project.
   */
  const awaitsDecision = (notification: any) =>
    notification.type === "NEW_PROJECT_REQUEST" && !notification.isRead;

  /**
   * Clicking a notification follows its deep link. Links carry the target as
   * query params (?project=&tab=&proposal=), which the destination dashboard
   * uses to open the right modal on the right tab.
   *
   * It also marks the notification read — unless it is still carrying a
   * decision, which stays unread until that decision is actually made.
   */
  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead && !awaitsDecision(notification)) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
      navigate(notification.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer bg-white hover:bg-slate-100 p-2 rounded-full transition-colors">
          <Bell className="size-6 text-slate-600" />
          {data?.unreadCount && data.unreadCount > 0 ? (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-pulse">
              {data.unreadCount}
            </span>
          ) : null}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl bg-white border-slate-200" align="end">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 bg-slate-50/50">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {data?.unreadCount && data.unreadCount > 0 ? (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-primary hover:underline font-medium"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-sm text-slate-400">
              Loading...
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.data.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative flex flex-col p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.isRead ? "bg-slate-50/30" : ""
                    }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`text-sm leading-tight ${!notification.isRead ? "font-bold text-red-600" : "text-slate-900 font-medium"
                        }`}
                    >
                      {notification.title}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {notification.message}
                  </p>

                  {/* Accept/Reject actions for new project requests */}
                  {awaitsDecision(notification) && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 px-3 text-[10px] bg-teal-500 hover:bg-teal-600 text-white cursor-pointer"
                        onClick={(e) => handleAccept(e, notification.id)}
                      >
                        <Check className="mr-1 size-3" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-3 text-[10px] bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                        onClick={(e) => handleReject(e, notification.id)}
                      >
                        <X className="mr-1 size-3" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Delete icon for read notifications */}
                  {notification.isRead && (
                    <button
                      onClick={(e) => handleDelete(e, notification.id)}
                      className="absolute right-2 bottom-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Bell className="size-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
