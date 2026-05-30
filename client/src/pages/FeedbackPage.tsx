import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, MessageSquare, CheckCircle2, AlertCircle, Clock,
  Filter, Search, ChevronLeft, Loader2, Eye, EyeOff,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type FeedbackStatus = "new" | "read" | "in_progress" | "resolved" | "archived" | "closed";

interface FeedbackItem {
  id: number;
  userId: number;
  type: string;
  subject: string;
  message: string;
  status: FeedbackStatus;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Reply {
  id: number;
  feedbackId: number;
  userId: number;
  isAdminReply: number;
  message: string;
  createdAt: Date;
}

const statusColors: Record<FeedbackStatus, string> = {
  new: "bg-blue-500",
  read: "bg-purple-500",
  in_progress: "bg-yellow-500",
  resolved: "bg-green-500",
  archived: "bg-gray-500",
  closed: "bg-gray-500",
};

const statusLabels: Record<FeedbackStatus, string> = {
  new: "New",
  read: "Read",
  in_progress: "In Progress",
  resolved: "Resolved",
  archived: "Archived",
  closed: "Closed",
};

const priorityColors: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-red-400",
};

export default function FeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [showMarkAsRead, setShowMarkAsRead] = useState(false);

  // Fetch user's feedback
  const { data: feedbackList = [], isLoading: feedbackLoading } = trpc.feedback.getUserFeedback.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch conversation for selected feedback
  const { data: conversation, isLoading: conversationLoading } = trpc.feedback.getConversation.useQuery(
    { feedbackId: selectedFeedback! },
    { enabled: !!selectedFeedback && !!user }
  );

  // Mutations
  const addReplyMutation = trpc.feedback.addReply.useMutation();
  const updateStatusMutation = trpc.feedback.updateStatus.useMutation();

  if (!user) {
    navigate("/");
    return null;
  }

  const filteredFeedback = (feedbackList || []).filter((item: any) => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch = item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleReply = async () => {
    if (!selectedFeedback || !replyMessage.trim()) return;

    try {
      await addReplyMutation.mutateAsync({
        feedbackId: selectedFeedback,
        message: replyMessage,
      });
      setReplyMessage("");
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  const handleMarkAsRead = async (feedbackId: number) => {
    try {
      await updateStatusMutation.mutateAsync({
        feedbackId,
        status: "read",
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">My Feedback</h1>
          <p className="text-slate-400">View and manage your feedback messages with our support team</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feedback List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 p-4">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search feedback..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                  {(["all", "new", "read", "in_progress", "resolved", "closed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded text-sm transition-all ${
                        filterStatus === status
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {status === "all" ? "All" : statusLabels[status as FeedbackStatus]}
                    </button>
                  ))}
                </div>

                {/* Feedback Items */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {feedbackLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    </div>
                  ) : filteredFeedback.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No feedback found</p>
                    </div>
                  ) : (
                    filteredFeedback.map((item: any) => (
                      <motion.button
                        key={item.id}
                        onClick={() => {
                          setSelectedFeedback(item.id);
                          if (item.status === "new") {
                            handleMarkAsRead(item.id);
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        className={`w-full text-left p-3 rounded border transition-all ${
                          selectedFeedback === item.id
                            ? "bg-slate-700 border-cyan-500"
                            : "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusColors[item.status as FeedbackStatus]} mt-1 flex-shrink-0`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{item.subject}</p>
                            <p className="text-xs text-slate-400 truncate">{item.message}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge className={`text-xs ${statusColors[item.status as FeedbackStatus]}`}>
                                {statusLabels[item.status as FeedbackStatus]}
                              </Badge>
                              <Badge className={`text-xs bg-slate-700 ${priorityColors[item.priority]}`}>
                                {item.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Conversation View */}
          <div className="lg:col-span-2">
            {selectedFeedback ? (
              <Card className="bg-slate-800/50 border-slate-700 p-6 h-full flex flex-col">
                {conversationLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  </div>
                ) : conversation?.feedback ? (
                  <>
                    {/* Header */}
                    <div className="mb-6 pb-4 border-b border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h2 className="text-2xl font-bold text-white">{conversation.feedback.subject}</h2>
                          <p className="text-slate-400 text-sm mt-1">
                            {new Date(conversation.feedback.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={statusColors[conversation.feedback.status as FeedbackStatus]}>
                            {statusLabels[conversation.feedback.status as FeedbackStatus]}
                          </Badge>
                          <Badge className={`bg-slate-700 ${priorityColors[conversation.feedback.priority]}`}>
                            {conversation.feedback.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-slate-300">{conversation.feedback.message}</p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                      {/* Original feedback */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-300">You</p>
                          <div className="bg-slate-700/50 rounded p-3 mt-1">
                            <p className="text-slate-200">{conversation.feedback.message}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(conversation.feedback.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Replies */}
                      <AnimatePresence>
                        {conversation.replies.map((reply: Reply) => (
                          <motion.div
                            key={reply.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              reply.isAdminReply ? "bg-green-500/20" : "bg-cyan-500/20"
                            }`}>
                              {reply.isAdminReply ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <MessageSquare className="w-4 h-4 text-cyan-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-300">
                                {reply.isAdminReply ? "Support Team" : "You"}
                              </p>
                              <div className={`rounded p-3 mt-1 ${
                                reply.isAdminReply ? "bg-green-500/10 border border-green-500/20" : "bg-slate-700/50"
                              }`}>
                                <p className="text-slate-200">{reply.message}</p>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(reply.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Reply Input */}
                    <div className="space-y-3 pt-4 border-t border-slate-700">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleReply}
                          disabled={!replyMessage.trim() || addReplyMutation.isPending}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          {addReplyMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>Select a feedback to view conversation</p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 p-6 h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Select a feedback to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
