"""Private, deterministic PDF audit. No model calls or public source-text export."""
import argparse, collections, hashlib, json, pathlib, re, sqlite3
import fitz

ROOT=pathlib.Path(__file__).resolve().parents[1]
def candidate_key(candidate):
    return hashlib.sha256(json.dumps(candidate, sort_keys=True).encode()).hexdigest()

def deduplicate_candidates(candidates):
    """Collapse identical records, preserving distinct pages, sources and variants."""
    return list({candidate_key(c): c for c in candidates}.values())

def normalise(text):
    text=re.sub(r'\d+\s*\|\s*\d+\s*\|?\s*BACK TO TABLE OF CONTENT','',text,flags=re.I)
    text=re.sub(r'\b\d+\s*/\s*\d+\b','',text)
    return re.sub(r'\s+',' ',re.sub(r'[^a-z0-9 ]',' ',text.lower())).strip()
def rows(text):
    """Candidate rows only. Layout and objective interpretation require review."""
    lines=[s.strip() for s in text.splitlines() if s.strip()]
    for i,line in enumerate(lines):
        if re.fullmatch(r'(?:[1-9]|1[0-3])(?:[–-](?:1[0-3]))?\.?',line):
            end=next((j for j in range(i+1,len(lines)) if re.fullmatch(r'(?:[1-9]|1[0-3])(?:[–-](?:1[0-3]))?\.?',lines[j])),len(lines))
            content=lines[i+1:end]
            if content: yield {'week':line,'candidate_topic':content[0],'private_text':'\n'.join(content),'review_status':'needs_review'}
def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--directory',type=pathlib.Path,default=ROOT/'reference-pdfs'); args=parser.parse_args()
    out=ROOT/'.local'; out.mkdir(exist_ok=True,mode=0o700); out.chmod(0o700)
    sources=[]; base=[]; index=collections.defaultdict(set); duplicates=[]; candidates=[]
    files=sorted(args.directory.glob('*.pdf'),key=lambda p:(not p.name.startswith('9706'),p.name))
    for path in files:
        doc=fitz.open(path); sid=path.name.split('-')[0]; tier='private_compilation' if sid in ['970605695','978433855'] else 'historical_lagos' if sid=='537689481' else 'partial_unverified_lagos' if sid=='915968705' else 'sales_sample'; pages=[]; grade=None; subject=None; term=None
        for n,page in enumerate(doc,1):
            raw=page.get_text(); norm=normalise(raw); ocr=False; previous_grade=grade; mixed_grade=False
            if len(norm)<40 and page.get_images():
                try: raw=page.get_text(textpage=page.get_textpage_ocr(dpi=150)); norm=normalise(raw); ocr=True
                except Exception: pass
            match=re.search(r'PRIMARY\s*([1-6])(?:\s*\)|\s+SCHEME|\s*$)',raw,re.M|re.I)
            if match:
                new_grade=int(match.group(1))
                if new_grade!=grade and sid in ['970605695','978433855']: subject=None; term=None
                grade=new_grade
            if sid=='537689481':
                gm=re.search(r'PRIMARY\s+(FOUR|FIVE|SIX|[456])\b',raw,re.I)
                if gm:
                    grade={'FOUR':4,'FIVE':5,'SIX':6,'4':4,'5':5,'6':6}[gm.group(1).upper()]
                    mixed_grade=previous_grade is not None and grade!=previous_grade and gm.start()>200
                hm=re.search(r'SCHEME OF WORK\s+([A-Z &/\n]+?)\s+PRIMARY',raw)
                if hm: subject=re.sub(r'\s+',' ',hm.group(1)).strip()
                if subject and 'MATHEMATICS' in subject: subject='MATHEMATICS'
                if re.search(r'(?:FIRST|SECOND|THIRD|[123](?:ST|ND|RD))\s+TERM\s+MATHEMATICS',raw,re.I): subject='MATHEMATICS'
                if 'PHYSICAL AND HEALTH' in raw[:400] and 'EDUCATION' in raw[:500] and gm: subject='PHYSICAL AND HEALTH EDUCATION'
            heading=re.search(r'([A-Z &/]+)\s+SCHEME OF WORK\s*\(PRIMARY\s*[1-6]\)',raw)
            if heading: subject=heading.group(1).strip()
            tm=re.search(r'\b(FIRST|SECOND|THIRD)\s+TERM\b',raw)
            if tm: term={'FIRST':1,'SECOND':2,'THIRD':3}[tm.group(1)]
            words=norm.split(); shingles=set(' '.join(words[i:i+5]) for i in range(max(0,len(words)-4)))
            canonical=None; score=0
            if sid=='978433855' and shingles:
                hits=collections.Counter(k for s in shingles for k in index.get(s,()))
                for k,_ in sorted(hits.items(),key=lambda item:(-item[1],item[0]))[:3]:
                    union=shingles|base[k]['shingles']; sim=len(shingles&base[k]['shingles'])/len(union) if union else 0
                    if sim>score: score=sim; canonical=base[k]['page']
                if score>=0.88: duplicates.append({'source':sid,'page':n,'canonical_source':'970605695','canonical_page':canonical,'similarity':round(score,4)})
                else: canonical=None
            if sid=='970605695':
                k=len(base); base.append({'page':n,'shingles':shingles})
                for s in shingles: index[s].add(k)
            if not canonical and (sid not in ['970605695','978433855'] or n>600) and not any(l.strip()=='TABLE OF CONTENT' for l in raw.splitlines()):
                for r in rows(raw):
                    if grade and subject: candidates.append({'source_id':sid,'pdf_page':n,'printed_page':int(re.match(r'\s*(\d+)\s*\|',raw).group(1)) if re.match(r'\s*(\d+)\s*\|',raw) else None,'grade':None if mixed_grade else grade,'grade_placement_review':mixed_grade,'original_subject_name':subject,'term':term,'authority_classification':tier,'confidence':'low','suggested_activity':None,'stated_learning_objective':None,'app_module':'Mathematics' if subject=='MATHEMATICS' else 'English' if 'ENGLISH' in subject else 'General Paper','import_status':'quarantined_duplicate_variant' if sid=='978433855' else 'candidate_only',**r})
            pages.append({'page':n,'text_characters':len(norm),'ocr_used':ocr,'normalised_hash':hashlib.sha256(norm.encode()).hexdigest(),'duplicate_of':canonical,'needs_layout_review':True})
        tier='private_compilation' if sid in ['970605695','978433855'] else 'historical_lagos' if sid=='537689481' else 'partial_unverified_lagos' if sid=='915968705' else 'sales_sample'
        sources.append({'id':sid,'filename':path.name,'pages':len(doc),'file_hash':hashlib.sha256(path.read_bytes()).hexdigest(),'authority_tier':tier,'rights_status':'private_reference_only','review_status':'needs_review','pages_audit':pages})
    extracted_count=len(candidates)
    candidates=deduplicate_candidates(candidates)
    result={'sources':sources,'duplicate_pages':duplicates,'candidate_rows':candidates,'exact_duplicate_candidates_removed':extracted_count-len(candidates),'note':'Candidate extraction is not an approved curriculum import. Continuation rows, grade and subject placement need human review.'}
    conn=sqlite3.connect(out/'curriculum-import.sqlite')
    conn.execute('CREATE TABLE IF NOT EXISTS candidate(id TEXT PRIMARY KEY,source_id TEXT,pdf_page INTEGER,grade INTEGER,term INTEGER,week TEXT,metadata TEXT)')
    conn.execute('DELETE FROM candidate')
    for c in candidates:
        key=candidate_key(c)
        conn.execute('INSERT INTO candidate VALUES (?,?,?,?,?,?,?)',(key,c['source_id'],c['pdf_page'],c['grade'],c['term'],c['week'],json.dumps(c)))
    conn.commit();conn.close();(out/'curriculum-import.sqlite').chmod(0o600)
    (out/'curriculum-audit.json').write_text(json.dumps(result,indent=2))
    summary={'sources':[{k:v for k,v in s.items() if k!='pages_audit'} for s in sources],'duplicate_pages':len(duplicates),'candidate_rows':len(candidates),'exact_duplicate_candidates_removed':extracted_count-len(candidates),'review_status':'needs_review','official_outcomes_mapped':0}
    (ROOT/'data/source-audit.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))
if __name__=='__main__': main()
