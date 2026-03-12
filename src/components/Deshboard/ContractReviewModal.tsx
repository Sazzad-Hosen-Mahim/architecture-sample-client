import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import {
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Eye,
    FileText,
    Loader2,
    PenLine,
    Download,
} from "lucide-react";
import {
    useGetContractForProposalQuery,
    useClientSignContractMutation,
    ContractSection,
} from "@/redux/api/adminDashboard/masterContractApi";
import { toast } from "sonner";
import { getServiceScopeDescription } from "@/lib/serviceDescriptions";

// PDF related imports
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
    Image,
    Font
} from '@react-pdf/renderer';

// Standard font registration (optional, but good for stability)
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
        { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' }
    ]
});

export const pdfStyles = StyleSheet.create({
    page: { padding: 50, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
    header: { marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', textTransform: 'uppercase' },
    companyName: { fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    flexRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    addressCol: { width: '60%' },
    dateCol: { width: '30%', textAlign: 'right' },
    bold: { fontWeight: 'bold' },
    subject: { marginTop: 20, marginBottom: 20 },
    greeting: { marginBottom: 15 },
    articleTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 15, marginBottom: 8, borderLeft: '3px solid #000', paddingLeft: 8 },
    content: { lineHeight: 1.5, marginBottom: 10, textAlign: 'justify' },
    serviceItem: { flexDirection: 'row', marginBottom: 5, paddingLeft: 10 },
    bullet: { width: 15 },
    table: { marginTop: 15, border: '1pt solid #eee' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderBottom: '1pt solid #eee', padding: 8 },
    tableRow: { flexDirection: 'row', borderBottom: '1pt solid #eee', padding: 8 },
    tableCellLeft: { flex: 4 },
    tableCellRight: { flex: 1, textAlign: 'right' },
    tableFooter: { flexDirection: 'row', backgroundColor: '#333', color: '#fff', padding: 8, fontWeight: 'bold' },
    signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 },
    signatureBox: { width: '45%', borderTop: '1pt solid #000', paddingTop: 10 },
    label: { fontSize: 8, color: '#666', marginBottom: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    sigImage: { height: 50, objectFit: 'contain', marginBottom: 5 },
    sigName: { fontWeight: 'bold', borderBottom: '1pt solid #eee', marginBottom: 4 }
});

export const ContractPDF = ({ contract, sections }: { contract: any; sections: ContractSection[] }) => (
    <Document>
        <Page size="A4" style={pdfStyles.page}>
            <View style={pdfStyles.header}>
                <Text style={pdfStyles.companyName}>Architecture Simple</Text>
                <View style={pdfStyles.flexRow}>
                    <View style={pdfStyles.addressCol}>
                        <Text style={pdfStyles.bold}>Client Name</Text>
                        <Text>{contract?.clientName || "Client Name"}</Text>
                        <Text>{contract?.projectLocation || ""}</Text>
                    </View>
                    <View style={pdfStyles.dateCol}>
                        <Text>Date: {new Date().toLocaleDateString()}</Text>
                        <Text>File No. 25-0001</Text>
                    </View>
                </View>
            </View>

            <View style={pdfStyles.subject}>
                <Text style={pdfStyles.bold}>Subject: Professional Services Proposal</Text>
                <Text>{contract?.clientName}</Text>
                <Text>{contract?.projectLocation}</Text>
            </View>

            <View style={pdfStyles.greeting}>
                <Text>Dear Client,</Text>
                <Text style={{ marginTop: 10 }}>
                    Architecture Simple is pleased to present this design services proposal for the proposed {contract?.serviceType || 'New Construction'} at {contract?.projectLocation || 'the project site'}.
                </Text>
            </View>

            {sections.map((section) => {
                const sectionKey = (section.articleKey || "").toLowerCase();
                const sectionTitle = (section.title || "").toLowerCase();
                const isScope = sectionKey.includes("scope") || sectionTitle.includes("scope");
                const isPayment = sectionKey.includes("payment") || sectionTitle.includes("payment");
                const services = contract?.services || [];

                // Split content into paragraphs/lines for proper rendering
                const contentLines = (section.content || "").split('\n').filter((line: string) => line.trim() !== '');

                return (
                    <View key={section.articleKey} style={{ marginBottom: 10 }}>
                        <Text style={pdfStyles.articleTitle} wrap={false}>{section.title}</Text>

                        {/* Render content - handle bullet points (•) as structured items */}
                        {contentLines.map((line: string, lineIdx: number) => {
                            const trimmed = line.trim();
                            const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
                            if (isBullet) {
                                const bulletText = trimmed.replace(/^[•\-]\s*/, '');
                                return (
                                    <View key={lineIdx} wrap={false} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 15 }}>
                                        <Text style={{ width: 12, fontSize: 10 }}>•</Text>
                                        <Text style={{ flex: 1, lineHeight: 1.5, fontSize: 10 }}>{bulletText}</Text>
                                    </View>
                                );
                            }
                            return (
                                <View key={lineIdx} wrap={false} style={{ marginBottom: 6 }}>
                                    <Text style={pdfStyles.content}>{trimmed}</Text>
                                </View>
                            );
                        })}

                        {/* Scope of Services - service descriptions */}
                        {isScope && services.length > 0 && (
                            <View style={{ marginTop: 10, marginBottom: 15 }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', color: '#555' }} wrap={false}>
                                    Scope of Professional Services
                                </Text>
                                {services.map((s: any) => {
                                    const scopeDesc = getServiceScopeDescription(s.name);

                                    // Parse per-service notes from JSON with resilient matching
                                    let perServiceNotes: string[] = [];
                                    try {
                                        if (contract?.notes) {
                                            if (contract.notes.trim().startsWith('{')) {
                                                const allNotes = JSON.parse(contract.notes);
                                                const sName = (s.name || "").toLowerCase().trim();
                                                const sTitle = (scopeDesc?.title || "").toLowerCase().trim();

                                                // Try matching against name or title
                                                const matchingKey = Object.keys(allNotes).find(k => {
                                                    const key = k.toLowerCase().trim();
                                                    return key === sName || key === sTitle ||
                                                        sName.includes(key) || key.includes(sName) ||
                                                        (sTitle && (sTitle.includes(key) || key.includes(sTitle)));
                                                });

                                                if (matchingKey) {
                                                    perServiceNotes = allNotes[matchingKey];
                                                }
                                            } else {
                                                // Legacy fallback: parse bracketed sections like [Design Development] 1. Note...
                                                const notes = contract.notes;
                                                const sName = (s.name || "").toLowerCase().trim();
                                                const sTitle = (scopeDesc?.title || "").toLowerCase().trim();

                                                const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                const escName = escapeRegex(sName);
                                                const escTitle = escapeRegex(sTitle);

                                                // Pattern: find [Anything matching service name/title] followed by content until next [ or end
                                                const pattern = `\\[[^\\]]*?(?:${escName}|${escTitle})[^\\]]*?\\](.*?)(?=\\[|$)`;
                                                const regex = new RegExp(pattern, 'is');
                                                const match = notes.match(regex);

                                                if (match && match[1]) {
                                                    perServiceNotes = match[1].trim().split('\n')
                                                        .map((line: string) => line.trim())
                                                        .filter((line: string) => line.length > 0);
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        console.error("Error parsing contract notes", e);
                                    }

                                    return (
                                        <View key={s.id} wrap={false} style={{ marginBottom: 12 }}>
                                            <View style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 5 }}>
                                                <Text style={{ width: 12, fontSize: 10 }}>•</Text>
                                                <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 10 }}>
                                                    {scopeDesc ? `${scopeDesc.sectionNumber} ${scopeDesc.title}` : s.name}
                                                </Text>
                                            </View>
                                            {scopeDesc && scopeDesc.bullets.map((bullet: string, idx: number) => (
                                                <View key={idx} wrap={false} style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 25 }}>
                                                    <Text style={{ width: 12, fontSize: 9 }}>–</Text>
                                                    <Text style={{ flex: 1, lineHeight: 1.5, fontSize: 9 }}>{bullet}</Text>
                                                </View>
                                            ))}

                                            {/* Render per-service notes directly under the service */}
                                            {perServiceNotes.length > 0 && (
                                                <View style={{ marginTop: 6, paddingLeft: 25 }}>
                                                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#666', marginBottom: 3, textTransform: 'uppercase' }}>
                                                        Additional Notes:
                                                    </Text>
                                                    {perServiceNotes.map((note, idx) => (
                                                        <View key={idx} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                                            <Text style={{ width: 10, fontSize: 9 }}>•</Text>
                                                            <Text style={{ flex: 1, fontSize: 9, fontStyle: 'italic', color: '#444' }}>{note}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Payment Terms - fee table */}
                        {isPayment && services.length > 0 && (
                            <View style={pdfStyles.table} wrap={false}>
                                <View style={pdfStyles.tableHeader}>
                                    <View style={pdfStyles.tableCellLeft}><Text style={pdfStyles.bold}>PROFESSIONAL SERVICES FEE</Text></View>
                                    <View style={pdfStyles.tableCellRight}><Text style={pdfStyles.bold}>AMOUNT</Text></View>
                                </View>
                                {services.map((s: any) => (
                                    <View key={s.id} style={pdfStyles.tableRow}>
                                        <View style={pdfStyles.tableCellLeft}><Text>{s.name}</Text></View>
                                        <View style={pdfStyles.tableCellRight}><Text>${Number(s.amount || 0).toLocaleString()}</Text></View>
                                    </View>
                                ))}
                                <View style={pdfStyles.tableFooter}>
                                    <View style={pdfStyles.tableCellLeft}><Text>TOTAL FEE</Text></View>
                                    <View style={pdfStyles.tableCellRight}><Text>${services.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0).toLocaleString()}</Text></View>
                                </View>
                            </View>
                        )}
                    </View>
                );
            })}

            <View style={pdfStyles.signatureSection} wrap={false}>
                <View style={pdfStyles.signatureBox}>
                    <Text style={pdfStyles.label}>Owner</Text>
                    {contract?.clientContractSignature ? (
                        <Image src={contract.clientContractSignature} style={pdfStyles.sigImage} />
                    ) : (
                        <View style={{ height: 50, justifyContent: 'center' }}><Text style={{ color: '#ccc', fontStyle: 'italic' }}>Pending Signature</Text></View>
                    )}
                    <Text style={pdfStyles.sigName}>{contract?.clientName || "Client Signature"}</Text>
                    <Text style={{ fontSize: 8, color: '#999' }}>Date: {contract?.clientContractSignedAt ? new Date(contract.clientContractSignedAt).toLocaleDateString() : 'N/A'}</Text>
                </View>

                <View style={pdfStyles.signatureBox}>
                    <Text style={pdfStyles.label}>Architect</Text>
                    {contract?.architectContractSignature ? (
                        <Image src={contract.architectContractSignature} style={pdfStyles.sigImage} />
                    ) : (
                        <View style={{ height: 50, justifyContent: 'center' }}><Text style={{ color: '#ccc', fontStyle: 'italic' }}>Pending Signature</Text></View>
                    )}
                    <Text style={pdfStyles.sigName}>Eric Rivera, AIA</Text>
                    <Text style={{ fontSize: 8, color: '#999' }}>Name: Eric Rivera, AIA</Text>
                </View>
            </View>
        </Page>
    </Document>
);

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

interface ContractReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposalId: string;
    onContractSigned?: () => void;
}

export default function ContractReviewModal({
    isOpen,
    onClose,
    proposalId,
    onContractSigned,
}: ContractReviewModalProps) {
    const { data: contractData, isLoading, refetch } = useGetContractForProposalQuery(proposalId, {
        skip: !isOpen || !proposalId,
    });
    const [signContract, { isLoading: isSigning }] = useClientSignContractMutation();

    const [readSections, setReadSections] = useState<Set<string>>(new Set());
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [showSignature, setShowSignature] = useState(false);
    const signatureRef = useRef<SignatureCanvas>(null);

    const contract = contractData?.data;
    const rawSections = contract?.contractSections;

    // Safety check for contractSections: prioritize array, handle stringified JSON, fallback to empty array
    const originalSections: ContractSection[] = (Array.isArray(rawSections)
        ? rawSections
        : (typeof rawSections === 'string' && (rawSections as string).trim().startsWith('['))
            ? JSON.parse(rawSections)
            : []) as ContractSection[];

    // Ensure Scope and Payment are present if missing to match PM view
    const sections = [...originalSections];
    const hasScope = sections.some(s =>
        (s.articleKey || "").toLowerCase().includes("scope") ||
        (s.title || "").toLowerCase().includes("scope")
    );
    const hasPayment = sections.some(s =>
        (s.articleKey || "").toLowerCase().includes("payment") ||
        (s.title || "").toLowerCase().includes("payment")
    );

    if (!hasScope) {
        sections.push({
            articleKey: "article_2_scope",
            title: "Article 2 - Scope of Services",
            content: "The Architect agrees to provide the following services for the Project as outlined in the Proposal.",
            order: sections.length > 0 ? Math.min(...sections.map(s => s.order)) - 0.5 : 2
        });
    }
    if (!hasPayment) {
        sections.push({
            articleKey: "article_3_payment",
            title: "Article 3 - Payment Terms",
            content: "The following terms outline the payment structure for the professional services provided.",
            order: sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 3
        });
    }

    // Ensure Project Understanding is present
    const hasProjectUnderstanding = sections.some(s =>
        (s.articleKey || "").toLowerCase().includes("project_understanding") ||
        (s.title || "").toLowerCase().includes("project understanding")
    );
    if (!hasProjectUnderstanding) {
        const serviceTypeDisplay = contract?.serviceType?.replace(/_/g, ' ').toLowerCase() || 'new construction';
        const cityVal = contract?.city || '';
        const stateVal = contract?.state || '';
        const locationPart = [cityVal, stateVal].filter(Boolean).join(', ');
        let puContent = `The Owner would like to build a ${serviceTypeDisplay} on a ${locationPart || contract?.projectLocation || 'the project site'}.`;
        if (contract?.projectDescription) {
            puContent += `\n\n${contract.projectDescription}`;
        }
        if (contract?.additionalContext) {
            puContent += `\n\n${contract.additionalContext}`;
        }
        const selectedServiceNames = (contract?.services || []).map((s: any) => s.name?.toLowerCase() || '');
        const servicePhases: string[] = [];
        if (selectedServiceNames.some((n: string) => n.includes('schematic'))) servicePhases.push('schematic');
        if (selectedServiceNames.some((n: string) => n.includes('development'))) servicePhases.push('design development');
        if (selectedServiceNames.some((n: string) => n.includes('construction doc'))) servicePhases.push('construction drawings');
        const phasesText = servicePhases.length > 0 ? servicePhases.map(p => `[${p}]`).join(', ') : '[schematic], [design development], [construction drawings]';
        puContent += `\n\nOwner has requested this design services proposal from Architecture Simple to provide pre-design, ${phasesText} for the proposed building; coordinate with the owner's consultant; and provide plan check bidding, construction support, and record drawings.`;
        sections.push({
            articleKey: "project_understanding",
            title: "Project Understanding",
            content: puContent,
            order: -2,
        });
    }

    // Ensure Article 1 - Definition is present
    const hasDefinition = sections.some(s =>
        (s.articleKey || "").toLowerCase().includes("definition") ||
        (s.title || "").toLowerCase().includes("definition")
    );
    if (!hasDefinition) {
        const clientNameVal = contract?.clientName || 'the Owner';
        const serviceTypeDisplay = contract?.serviceType?.replace(/_/g, ' ').toLowerCase() || 'new construction';
        const cityVal = contract?.city || '';
        const stateVal = contract?.state || '';
        const locationPart = [cityVal, stateVal].filter(Boolean).join(', ');
        const defContent = `To establish a clear understanding, the following terms are defined for use throughout this Agreement:

• "Architect" refers to Architecture Simple Inc., represented by Eric Rivera, AIA, who will provide professional architectural services as detailed in this Agreement.
• "Owner" refers to ${clientNameVal}, the individual or entity who is entering into this Agreement with the Architect to develop the Project.
• "Project" refers to the construction of a ${serviceTypeDisplay} at ${contract?.projectDescription || 'the project site'} in ${locationPart || contract?.projectLocation || 'the project location'}, as more specifically described in the Proposal attached hereto.
• "Work" refers to all architectural, engineering, and related professional services required for the design, development, and documentation of the Project, as set forth in the Scope of Services.
• "Written Notice" shall include electronic mail (email), certified mail, or any other documented form of communication acknowledged by both parties.
• "Instruments of Service" refer to all drawings, specifications, calculations, and related materials prepared by the Architect as part of professional services.
• "Design Documents" refers to the completed Schematic Design and Design Development documents, including all drawings, specifications, and other materials prepared by the Architect as part of the development of the Project.
• "Construction Documents" (CDs) refers to the completed set of final documents that provide the necessary details for construction and permitting, including plans, specifications, and other materials, prepared by the Architect.
• "Bidding Documents" refers to the final, completed Construction Documents and any related documents issued to contractors or bidders.
• "Substantial Completion" means the point in time when the Project is sufficiently complete in accordance with the Contract Documents, allowing the Owner to occupy or utilize the building for its intended use.
• "Completion" refers to the final completion of all construction work, including punch list items and final inspections, after which the Project is fully delivered to the Owner.`;
        sections.push({
            articleKey: "article_1_definitions",
            title: "Article 1 - Definition",
            content: defContent,
            order: -1,
        });
    }

    // Sort sections by order
    sections.sort((a, b) => (a.order || 0) - (b.order || 0));

    const isAlreadySigned = !!contract?.clientContractSignature;

    const toggleSection = (key: string) => {
        setExpandedSection(expandedSection === key ? null : key);
    };

    const markAsRead = (key: string) => {
        const next = new Set(readSections);
        next.add(key);
        setReadSections(next);

        // Auto-expand next section or show signature if all read
        const currentIndex = sections.findIndex((s) => s.articleKey === key);
        if (currentIndex < sections.length - 1) {
            setExpandedSection(sections[currentIndex + 1].articleKey);
        } else {
            setExpandedSection(null);
        }
    };

    const allSectionsRead = sections.length > 0 && readSections.size === sections.length;

    const handleSign = async () => {
        if (!allSectionsRead && !isAlreadySigned) {
            toast.error("Please read and mark all sections as complete before signing.");
            return;
        }

        if (signatureRef.current?.isEmpty()) {
            toast.error("Please provide your signature");
            return;
        }

        const signatureData = signatureRef.current?.toDataURL();
        try {
            await signContract({
                proposalId,
                clientSignature: signatureData!,
            }).unwrap();
            toast.success("Contract signed successfully!");
            refetch();
            onContractSigned?.();
            onClose();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to sign contract");
        }
    };

    const clearSignature = () => {
        signatureRef.current?.clear();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col p-0 border-none shadow-2xl bg-white overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {isAlreadySigned ? "View Signed Contract" : "Review & Sign Contract"}
                            </h3>
                            <p className="text-xs text-gray-500">
                                Project: {contract?.projectName || "No Project Name"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <span className="ml-3 text-gray-500">Loading contract...</span>
                        </div>
                    ) : sections.length === 0 ? (
                        <div className="text-center py-16 space-y-3">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                            <p className="text-gray-500">No contract sections attached to this proposal.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isAlreadySigned && (
                                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-green-800 font-medium">Contract Signed</p>
                                        <p className="text-green-600 text-sm">
                                            Signed on {contract?.clientContractSignedAt ? new Date(contract.clientContractSignedAt).toLocaleString() : "Recently"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!isAlreadySigned && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                                    <span className="text-sm text-blue-700 font-medium">
                                        Sections Read: {readSections.size} / {sections.length}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                                style={{ width: `${(readSections.size / (sections.length || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-blue-500 font-bold">
                                            {sections.length > 0 ? Math.round((readSections.size / sections.length) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {sections.map((section, index) => {
                                    const isRead = readSections.has(section.articleKey);
                                    const isExpanded = expandedSection === section.articleKey;

                                    return (
                                        <div
                                            key={section.articleKey}
                                            className={`border rounded-lg overflow-hidden transition-all ${isRead || isAlreadySigned
                                                ? "border-green-100 bg-green-50/20"
                                                : "border-gray-200"
                                                }`}
                                        >
                                            <button
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                onClick={() => toggleSection(section.articleKey)}
                                            >
                                                <span
                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${(isRead || isAlreadySigned)
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-600"
                                                        }`}
                                                >
                                                    {(isRead || isAlreadySigned) ? <Check className="w-4 h-4" /> : index + 1}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900 flex-1">
                                                    {section.title}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {(isRead && !isAlreadySigned) && (
                                                        <span className="text-xs text-green-600 font-medium whitespace-nowrap">Read ✓</span>
                                                    )}
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="px-4 pb-4 border-t border-gray-100 space-y-4">
                                                    <div className="pt-3">
                                                        <ArticleRenderer section={section} contract={contract} />
                                                    </div>
                                                    {(!isRead && !isAlreadySigned) && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => markAsRead(section.articleKey)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Mark as Read
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Signatures */}
                            {(isAlreadySigned || showSignature) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-100">
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Architect Signature</p>
                                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                            {contract?.architectContractSignature ? (
                                                <div className="space-y-2">
                                                    <img
                                                        src={contract.architectContractSignature}
                                                        alt="Architect Signature"
                                                        className="h-16 object-contain"
                                                    />
                                                    <div className="pt-2 border-t border-gray-100">
                                                        <p className="text-sm font-bold text-gray-900">Eric Rivera, AIA</p>
                                                        <p className="text-xs text-gray-500">Principal Architect</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Pending signature</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Client Signature</p>
                                        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                                            {isAlreadySigned ? (
                                                <div className="space-y-2">
                                                    <img
                                                        src={contract.clientContractSignature!}
                                                        alt="Client Signature"
                                                        className="h-16 object-contain"
                                                    />
                                                    <div className="pt-2 border-t border-gray-100">
                                                        <p className="text-sm font-bold text-gray-900">{contract?.clientName || "Client"}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Signed on {contract?.clientContractSignedAt ? new Date(contract.clientContractSignedAt).toLocaleDateString() : "Recently"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="border border-gray-200 rounded bg-white">
                                                        <SignatureCanvas
                                                            ref={signatureRef}
                                                            canvasProps={{
                                                                width: 400,
                                                                height: 120,
                                                                className: "w-full",
                                                                style: { width: "100%", height: "120px" }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={handleSign}
                                                            disabled={isSigning}
                                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                                        >
                                                            {isSigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign & Complete"}
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={clearSignature}>
                                                            Clear
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isAlreadySigned && allSectionsRead && !showSignature && (
                                <div className="mt-8">
                                    <Button
                                        className="w-full py-6 text-sm text-white cursor-pointer bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200"
                                        onClick={() => setShowSignature(true)}
                                    >
                                        <PenLine className="w-5 h-5 mr-2" />
                                        Proceed to Signature
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="text-xs text-gray-400 font-medium">
                        {contract?.projectName || "Proposal"} Agreement
                    </div>
                    <div className="flex items-center gap-2">
                        {isAlreadySigned && (
                            <PDFDownloadLink
                                document={<ContractPDF contract={contract} sections={sections} />}
                                fileName={`Contract_${contract?.projectName || "Proposal"}.pdf`}
                            >
                                {({ loading }) => (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={loading}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        {loading ? "Preparing PDF..." : "Download PDF"}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ArticleRenderer({ section, contract, isForPdf = false }: { section: ContractSection; contract: any; isForPdf?: boolean }) {
    const sectionKey = (section.articleKey || "").toLowerCase();
    const sectionTitle = (section.title || "").toLowerCase();

    // Flexible detection for Scope and Payment sections
    const isScope = sectionKey.includes("scope") ||
        sectionTitle.includes("scope") ||
        sectionKey === "article_2_scope";

    const isPayment = sectionKey.includes("payment") ||
        sectionTitle.includes("payment") ||
        sectionKey === "article_3_payment";

    const services = contract?.services || [];

    return (
        <div className="space-y-6">
            <p className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${isForPdf ? "text-[11pt]" : "text-sm"}`}>
                {section.content}
            </p>

            {isScope && services.length > 0 && (
                <div className={`${isForPdf ? "mt-6 py-4 px-6 bg-gray-50 rounded" : "bg-white p-5 rounded-xl border border-gray-100 shadow-sm"}`}>
                    <h5 className={`${isForPdf ? "text-sm" : "text-xs"} font-bold text-gray-500 uppercase tracking-widest mb-4 border-b pb-2`}>
                        Scope of Professional Services
                    </h5>
                    <div className="space-y-6">
                        {services.map((service: any) => {
                            const scopeDesc = getServiceScopeDescription(service.name);

                            // Parse per-service notes from JSON with resilient matching
                            let perServiceNotes: string[] = [];
                            try {
                                if (contract?.notes) {
                                    if (contract.notes.trim().startsWith('{')) {
                                        const allNotes = JSON.parse(contract.notes);
                                        const sName = (service.name || "").toLowerCase().trim();
                                        const sTitle = (scopeDesc?.title || "").toLowerCase().trim();

                                        // Try matching against name or title
                                        const matchingKey = Object.keys(allNotes).find(k => {
                                            const key = k.toLowerCase().trim();
                                            return key === sName || key === sTitle ||
                                                sName.includes(key) || key.includes(sName) ||
                                                (sTitle && (sTitle.includes(key) || key.includes(sTitle)));
                                        });

                                        if (matchingKey) {
                                            perServiceNotes = allNotes[matchingKey];
                                        }
                                    } else {
                                        // Legacy fallback: parse bracketed sections like [Design Development] 1. Note...
                                        const notes = contract.notes;
                                        const sName = (service.name || "").toLowerCase().trim();
                                        const sTitle = (scopeDesc?.title || "").toLowerCase().trim();

                                        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                        const escName = escapeRegex(sName);
                                        const escTitle = escapeRegex(sTitle);

                                        // Pattern: find [Anything matching service name/title] followed by content until next [ or end
                                        const pattern = `\\[[^\\]]*?(?:${escName}|${escTitle})[^\\]]*?\\](.*?)(?=\\[|$)`;
                                        const regex = new RegExp(pattern, 'is');
                                        const match = notes.match(regex);

                                        if (match && match[1]) {
                                            perServiceNotes = match[1].trim().split('\n')
                                                .map((line: string) => line.trim())
                                                .filter((line: string) => line.length > 0);
                                        }
                                    }
                                }
                            } catch (e) {
                                // Fallback
                            }

                            return (
                                <div key={service.id} className="space-y-2">
                                    <div className="flex items-start gap-3">
                                        <Check className={`w-4 h-4 text-green-600 mt-1 flex-shrink-0`} />
                                        <p className={`${isForPdf ? "text-[11pt]" : "text-sm"} font-bold text-gray-900`}>
                                            {scopeDesc ? `${scopeDesc.sectionNumber} ${scopeDesc.title}` : service.name}
                                        </p>
                                    </div>
                                    {scopeDesc && (
                                        <ul className={`ml-7 space-y-1 ${isForPdf ? "text-[10pt]" : "text-xs"} text-gray-700 list-disc pl-4`}>
                                            {scopeDesc.bullets.map((bullet, idx) => (
                                                <li key={idx} className="leading-relaxed">{bullet}</li>
                                            ))}
                                        </ul>
                                    )}

                                    {/* Per-service notes for UI */}
                                    {perServiceNotes.length > 0 && (
                                        <div className="ml-11 mt-2 space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Additional Notes:</p>
                                            <ul className="space-y-1">
                                                {perServiceNotes.map((note, idx) => (
                                                    <li key={idx} className="text-xs text-gray-600 bg-amber-50/50 border-l-2 border-amber-200 pl-3 py-1 flex items-start gap-2">
                                                        <span className="text-amber-500">•</span>
                                                        <span>{note}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {isPayment && services.length > 0 && (
                <div className={`${isForPdf ? "mt-6" : "overflow-hidden rounded-xl border border-gray-200"}`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`${isForPdf ? "bg-gray-100" : "bg-gray-50"} border-b border-gray-200`}>
                                <th className={`px-4 py-3 font-bold text-gray-600 uppercase tracking-widest ${isForPdf ? "text-[9pt]" : "text-[10px]"}`}>
                                    Project Phase / Service Description
                                </th>
                                <th className={`px-4 py-3 font-bold text-gray-600 uppercase tracking-widest text-right ${isForPdf ? "text-[9pt]" : "text-[10px]"}`}>
                                    Fee (USD)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {services.map((service: any) => (
                                <tr key={service.id}>
                                    <td className={`px-4 py-4 text-gray-800 ${isForPdf ? "text-[11pt]" : "text-sm"}`}>
                                        {service.name}
                                    </td>
                                    <td className={`px-4 py-4 font-bold text-right text-gray-900 ${isForPdf ? "text-[11pt]" : "text-sm"}`}>
                                        ${Number(service.amount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-900 text-white shadow-lg">
                            <tr>
                                <td className={`px-4 py-4 font-bold uppercase tracking-widest ${isForPdf ? "text-[10pt]" : "text-xs"}`}>
                                    Total Professional Architectural Fee
                                </td>
                                <td className={`px-4 py-4 font-bold text-right ${isForPdf ? "text-[12pt]" : "text-base"}`}>
                                    ${services.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
