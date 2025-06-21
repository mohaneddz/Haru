import doc1 from '@/data/documents/doc1.png';
import doc2 from '@/data/documents/doc2.png';
import doc3 from '@/data/documents/doc3.png';
import doc4 from '@/data/documents/doc4.png';

// @ts-ignore
import DocumentCard from "@/components/01 - Home/DocumentCard";
import MainSeperator from '@/components/01 - Home/MainSeperator';

export default function Documents() {
  return (
    <div class="flex flex-col items-center justify-start h-full w-full overflow-y-scroll mt-20">

      <MainSeperator title='Artificial Intelligence' description='Explore our courses' />

      <div class="grid grid-cols-4 gap-8 w-full max-w-[80%] p-4">

        <DocumentCard title='I-Statistics S01' icon='graph' img={doc1} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S02' icon='graph' img={doc2} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S03' icon='graph' img={doc3} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S04' icon='graph' img={doc4} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S01' icon='graph' img={doc1} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S02' icon='graph' img={doc2} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S03' icon='graph' img={doc3} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S04' icon='graph' img={doc4} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S01' icon='graph' img={doc1} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S02' icon='graph' img={doc2} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S03' icon='graph' img={doc3} description="How we turn Time data into insights" />
        <DocumentCard title='I-Statistics S04' icon='graph' img={doc4} description="How we turn Time data into insights" />
      </div>
    </div>
  );
};
