import {
  AzureKeyCredential,
  SearchIndex,
  SearchIndexClient
} from '@azure/search-documents'
import { NextResponse } from 'next/server'

import { readdir } from 'fs/promises'
import { join } from 'path'

const createSearchIndex = async () => {
  // Making sure search index exists
  const searchIndex = process.env.AZURE_SEARCH_INDEX_NAME ?? ''

  const client = new SearchIndexClient(
    `https://${process.env.AZURE_SEARCH_SERVICE}.search.windows.net/`,
    new AzureKeyCredential(process.env.AZURE_KEY ?? '')
  )

  const result = await client.listIndexesNames()
  let listOfIndexNames = []
  let currentIndex = await result.next()
  listOfIndexNames.push(currentIndex.value)

  while (!currentIndex.done) {
    currentIndex = await result.next()
    listOfIndexNames.push(currentIndex.value)
  }

  // Index Found
  if (listOfIndexNames.includes(searchIndex)) {
    console.log(` > Search Index ${searchIndex} already exists!`)
    return
  }

  // Index Not Found - Create

  const index: SearchIndex = {
    name: searchIndex,
    fields: [
      {
        name: 'id',
        type: 'Edm.String',
        key: true
      },
      {
        name: 'content',
        type: 'Edm.String',
        analyzerName: 'en.microsoft',
        searchable: true
      },
      {
        name: 'category',
        type: 'Edm.String',
        filterable: true,
        facetable: true
      },
      {
        name: 'sourcepage',
        type: 'Edm.String',
        filterable: true,
        facetable: true
      },
      {
        name: 'sourcefile',
        type: 'Edm.String',
        filterable: true,
        facetable: true
      }
    ]
  }

  // XXX: Wasn't able to convert this from Python to JS
  // semantic_settings=SemanticSettings(
  //   configurations=[SemanticConfiguration(
  //       name='default',
  //       prioritized_fields=PrioritizedFields(
  //           title_field=None, prioritized_content_fields=[SemanticField(field_name='content')]
  //       )
  //   )]
  // )
  console.log(` > Creating Index ${searchIndex}!`)
  await client.createIndex(index)
}

const uploadBlobs = (filePath: string) => {
  console.log(filePath)
  // Connect to BlobServiceClient

  // Get the Blog Container
  //  Create if not exists
  // XXX: Ignore all other files but .pdf
  // https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf
  // Split PDF into pages
  // Upload each page
}

export async function GET(req: Request) {
  // Create Search Index
  // createSearchIndex()

  // Get Files from 'data' folder
  const directoryPath = join(process.cwd(), 'data')
  const directoryFiles = await readdir(directoryPath)

  // For Each File
  for (const file of directoryFiles) {
    const filePath = join(directoryPath, file)

    //  . Upload Blobs
    uploadBlobs(filePath)

    //  . Get Document Text
    //  . Create Sections
    //  . Index Sections
  }

  return NextResponse.json({
    message: 'Done'
  })
}
