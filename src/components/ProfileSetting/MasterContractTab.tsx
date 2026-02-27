import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
    Accordion,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import {
    FileText,
    Plus,
    Save,
    Trash2,
    Loader2,
    Sparkles,
    Check,
    X,
    Edit3,
    AlertCircle,
    ListOrdered,
} from "lucide-react";
import { toast } from "sonner";
import {
    useGetMasterContractArticlesQuery,
    useCreateMasterContractArticleMutation,
    useUpdateMasterContractArticleMutation,
    useDeleteMasterContractArticleMutation,
    useSeedMasterContractMutation,
    MasterContractArticle,
} from "@/redux/api/adminDashboard/masterContractApi";

export default function MasterContractTab() {
    const { data: articlesData, isLoading } = useGetMasterContractArticlesQuery();
    const [createArticle, { isLoading: isCreating }] = useCreateMasterContractArticleMutation();
    const [updateArticle, { isLoading: isUpdating }] = useUpdateMasterContractArticleMutation();
    const [deleteArticle, { isLoading: isDeleting }] = useDeleteMasterContractArticleMutation();
    const [seedDefaults, { isLoading: isSeeding }] = useSeedMasterContractMutation();

    // Local state for editing
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editOrder, setEditOrder] = useState(0);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newArticle, setNewArticle] = useState({
        articleKey: "",
        title: "",
        content: "",
        order: 0,
    });

    const articles = articlesData?.data || [];

    const startEditing = (article: MasterContractArticle) => {
        setEditingId(article.id);
        setEditTitle(article.title);
        setEditContent(article.content);
        setEditOrder(article.order);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitle("");
        setEditContent("");
    };

    const handleSave = async (id: string) => {
        try {
            await updateArticle({
                id,
                title: editTitle,
                content: editContent,
                order: editOrder,
            }).unwrap();
            toast.success("Article updated successfully");
            cancelEditing();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update article");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this contract article?")) return;
        try {
            await deleteArticle(id).unwrap();
            toast.success("Article deleted");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete article");
        }
    };

    const handleCreate = async () => {
        if (!newArticle.articleKey || !newArticle.title || !newArticle.content) {
            toast.error("Please fill in all required fields");
            return;
        }
        try {
            await createArticle({
                articleKey: newArticle.articleKey,
                title: newArticle.title,
                content: newArticle.content,
                order: newArticle.order || articles.length + 1,
            }).unwrap();
            toast.success("New article created");
            setShowAddForm(false);
            setNewArticle({ articleKey: "", title: "", content: "", order: 0 });
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to create article");
        }
    };

    const handleSeedDefaults = async () => {
        try {
            await seedDefaults().unwrap();
            toast.success("Default contract articles seeded successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to seed defaults");
        }
    };

    if (isLoading) {
        return (
            <Card className="border border-gray-200 shadow-sm">
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-gray-500">Loading contract articles...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                Master Contract
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-500">
                                Manage the static contract articles that appear in proposals sent to clients
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {articles.length === 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSeedDefaults}
                                disabled={isSeeding}
                                className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            >
                                {isSeeding ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4 mr-1" />
                                )}
                                Load Defaults
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Article
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4 space-y-4">
                {/* Info Banner */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                        These articles form the master contract template. When a proposal is sent, the current
                        content is snapshot and attached to the proposal. You can edit these articles at any time
                        — changes will only affect future proposals.
                    </p>
                </div>

                {/* Add New Article Form */}
                {showAddForm && (
                    <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-blue-500" />
                            New Contract Article
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Article Key (unique identifier)
                                </label>
                                <Input
                                    placeholder="e.g., article_7_insurance"
                                    value={newArticle.articleKey}
                                    onChange={(e) =>
                                        setNewArticle({ ...newArticle, articleKey: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Article Title
                                </label>
                                <Input
                                    placeholder="e.g., Article 7 - Insurance Requirements"
                                    value={newArticle.title}
                                    onChange={(e) =>
                                        setNewArticle({ ...newArticle, title: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Display Order
                                </label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 7"
                                    value={newArticle.order}
                                    onChange={(e) =>
                                        setNewArticle({ ...newArticle, order: Number(e.target.value) })
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Content
                            </label>
                            <Textarea
                                placeholder="Enter the static contract text for this article..."
                                value={newArticle.content}
                                onChange={(e) =>
                                    setNewArticle({ ...newArticle, content: e.target.value })
                                }
                                rows={5}
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <Button
                                size="sm"
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isCreating ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4 mr-1" />
                                )}
                                Create Article
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewArticle({ articleKey: "", title: "", content: "", order: 0 });
                                }}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Articles List */}
                {articles.length === 0 && !showAddForm ? (
                    <div className="text-center py-12 space-y-3">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                        <p className="text-gray-500 text-sm">
                            No contract articles yet. Click "Load Defaults" to start with the standard template,
                            or "Add Article" to create your own.
                        </p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="space-y-2">
                        {articles.map((article) => (
                            <AccordionItem
                                key={article.id}
                                value={article.id}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 transition-colors [&[data-state=open]]:bg-gray-50">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-gray-100 text-gray-500 flex-shrink-0">
                                            <ListOrdered className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                                Order {article.order}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 text-left">
                                                {article.title}
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    {editingId === article.id ? (
                                        /* Editing Mode */
                                        <div className="space-y-3 pt-2">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Title
                                                    </label>
                                                    <Input
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className="font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Display Order
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={editOrder}
                                                        onChange={(e) => setEditOrder(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Content
                                                </label>
                                                <Textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={10}
                                                    className="text-sm leading-relaxed"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSave(article.id)}
                                                    disabled={isUpdating}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    {isUpdating ? (
                                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4 mr-1" />
                                                    )}
                                                    Save Changes
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={cancelEditing}
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div className="pt-2 space-y-3">
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {article.content}
                                            </p>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-400">
                                                    Key: {article.articleKey} • Last updated:{" "}
                                                    {new Date(article.updatedAt).toLocaleDateString()}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => startEditing(article)}
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDelete(article.id)}
                                                        disabled={isDeleting}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card >
    );
}
