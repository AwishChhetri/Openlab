import React, { useState } from 'react';
import { RotateCcw, ChevronDown, Bold, Italic, Underline, AlignLeft, List, ListOrdered, Quote, Code } from 'lucide-react';

interface RichTextEditorProps {
    editorRef: React.RefObject<HTMLDivElement | null>;
    body: string;
    setBody: (html: string) => void;
    isEditorEmpty: boolean;
    setIsEditorEmpty: (empty: boolean) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    editorRef,
    setBody,
    isEditorEmpty,
    setIsEditorEmpty
}) => {
    const [editorFontSize, setEditorFontSize] = useState<'sm' | 'md' | 'lg'>('lg');
    const [editorAlign, setEditorAlign] = useState<'left' | 'center' | 'right'>('left');
    const [showFontMenu, setShowFontMenu] = useState(false);
    const [showAlignMenu, setShowAlignMenu] = useState(false);

    const focusEditor = () => {
        editorRef.current?.focus();
    };

    const preventBlur = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    const exec = (command: string, value?: string) => {
        focusEditor();
        document.execCommand(command, false, value);
        const html = editorRef.current?.innerHTML ?? '';
        setBody(html);
        const text = (editorRef.current?.textContent || '').replace(/\u00A0/g, ' ').trim();
        setIsEditorEmpty(text.length === 0);
    };

    const handleEditorInput = () => {
        const html = editorRef.current?.innerHTML ?? '';
        setBody(html);
        const text = (editorRef.current?.textContent || '').replace(/\u00A0/g, ' ').trim();
        setIsEditorEmpty(text.length === 0);
    };

    return (
        <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-6 text-slate-300 overflow-x-auto overflow-y-visible pb-2 no-scrollbar relative">
                <RotateCcw
                    size={18}
                    className="cursor-pointer hover:text-slate-600"
                    onMouseDown={preventBlur}
                    onClick={() => exec('undo')}
                />
                <RotateCcw
                    size={18}
                    className="cursor-pointer hover:text-slate-600 rotate-180"
                    onMouseDown={preventBlur}
                    onClick={() => exec('redo')}
                />
                <div className="h-4 w-[1px] bg-slate-100" />
                <div
                    className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 relative"
                    onMouseDown={preventBlur}
                    onClick={() => { setShowFontMenu(!showFontMenu); setShowAlignMenu(false); }}
                >
                    <span className="text-[13px] font-bold">T</span><span className="text-[10px] font-bold">T</span>
                    <ChevronDown size={12} />
                    {showFontMenu && (
                        <div className="absolute left-0 top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50 min-w-[160px]">
                            {[
                                { label: 'Small', value: 'sm' as const },
                                { label: 'Normal', value: 'md' as const },
                                { label: 'Large', value: 'lg' as const },
                            ].map(item => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onMouseDown={preventBlur}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditorFontSize(item.value);
                                        exec('fontSize', item.value === 'sm' ? '2' : item.value === 'md' ? '3' : '5');
                                        setShowFontMenu(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-bold ${editorFontSize === item.value ? 'text-slate-900 bg-slate-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="h-4 w-[1px] bg-slate-100" />
                <Bold size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('bold')} />
                <Italic size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('italic')} />
                <Underline size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('underline')} />
                <div className="h-4 w-[1px] bg-slate-100" />
                <AlignLeft
                    size={18}
                    className="cursor-pointer hover:text-slate-600"
                    onMouseDown={preventBlur}
                    onClick={() => { setEditorAlign('left'); exec('justifyLeft'); }}
                />
                <div
                    className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 relative"
                    onMouseDown={preventBlur}
                    onClick={() => { setShowAlignMenu(!showAlignMenu); setShowFontMenu(false); }}
                >
                    <AlignLeft size={18} className="scale-y-[-1]" />
                    <ChevronDown size={12} />
                    {showAlignMenu && (
                        <div className="absolute left-0 top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50 min-w-[160px]">
                            {[
                                { label: 'Left', value: 'left' as const },
                                { label: 'Center', value: 'center' as const },
                                { label: 'Right', value: 'right' as const },
                            ].map(item => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onMouseDown={preventBlur}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditorAlign(item.value);
                                        exec(item.value === 'left' ? 'justifyLeft' : item.value === 'center' ? 'justifyCenter' : 'justifyRight');
                                        setShowAlignMenu(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-bold ${editorAlign === item.value ? 'text-slate-900 bg-slate-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="h-4 w-[1px] bg-slate-100" />
                <List size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('insertUnorderedList')} />
                <ListOrdered size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('insertOrderedList')} />
                <div className="h-4 w-[1px] bg-slate-100" />
                <Quote size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('formatBlock', '<blockquote>')} />
                <Code size={18} className="cursor-pointer hover:text-slate-600" onMouseDown={preventBlur} onClick={() => exec('formatBlock', '<pre>')} />
            </div>
            <div className="relative">
                {isEditorEmpty && (
                    <div className="pointer-events-none absolute top-4 left-4 text-slate-400 text-lg">
                        Type Your Reply...
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onMouseDown={() => { setShowAlignMenu(false); setShowFontMenu(false); }}
                    className={`w-full min-h-[400px] text-slate-900 leading-relaxed focus:outline-none font-sans whitespace-pre-wrap px-4 py-4 ${editorFontSize === 'sm' ? 'text-sm' : editorFontSize === 'md' ? 'text-base' : 'text-lg'}`}
                    style={{ textAlign: editorAlign }}
                />
            </div>
        </div>
    );
};
