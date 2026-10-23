import importlib.util, json, pathlib, sqlite3, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('importer',ROOT/'scripts/import_curriculum.py'); importer=importlib.util.module_from_spec(spec);spec.loader.exec_module(importer)
class CorpusTests(unittest.TestCase):
 def test_duplicate_records_keep_distinct_source_provenance(self):
  row={'source_id':'original','pdf_page':10,'week':'1','candidate_topic':'Counting'}
  same=dict(reversed(list(row.items())))
  other_page={**row,'pdf_page':11}
  other_source={**row,'source_id':'comparison'}
  result=importer.deduplicate_candidates([row,same,other_page,other_source])
  self.assertEqual(result,[row,other_page,other_source])
  self.assertEqual(importer.deduplicate_candidates(result),result)
 def test_normalisation_removes_compilation_footer(self):
  self.assertEqual(importer.normalise('674 | 985|BACK TO TABLE OF CONTENT\nEqual parts.'),'equal parts')
 def test_candidate_rows_are_always_unreviewed(self):
  result=list(importer.rows('1\nWhole numbers\nCount objects\n2\nFractions\nEqual parts'))
  self.assertEqual(len(result),2);self.assertTrue(all(r['review_status']=='needs_review' for r in result))
 def test_private_corpus_traceability_and_exclusions(self):
  path=ROOT/'.local/curriculum-audit.json'
  if not path.exists(): self.skipTest('Private source corpus has not been imported')
  audit=json.loads(path.read_text());rows=audit['candidate_rows']
  expected={674:2,680:2,746:3,848:5,853:5,901:6,907:6}
  for page,grade in expected.items():
   matches=[r for r in rows if r['source_id']=='970605695' and r['pdf_page']==page]
   self.assertTrue(matches,f'missing page {page}');self.assertTrue(all(r['grade']==grade for r in matches))
  self.assertFalse(any(r['source_id']=='915968705' and r['grade'] in [2,3] for r in rows))
  self.assertTrue(all(r['import_status']=='quarantined_duplicate_variant' for r in rows if r['source_id']=='978433855'))
  self.assertGreater(len(audit['duplicate_pages']),600)
  self.assertEqual(len(audit['sources']),5)
  conn=sqlite3.connect(ROOT/'.local/curriculum-import.sqlite')
  self.assertEqual(conn.execute('select count(*) from candidate').fetchone()[0],len(rows));conn.close()
if __name__=='__main__': unittest.main()
