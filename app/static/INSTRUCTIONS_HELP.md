## Home
The home menu is the default menu which lets users use Insert Tool specific features as well as Onshape features. 

 - **Insert Tool Features**

    Users can navigate to Insert Tool app specific features here.
 
   1. My Libraries - users can add and remove parts libraries to and from here for quick access.
   2. Favorited - users can add and remove documents to and from here for quick access.
   3. Recently Inserted - Documents that the user inserts will appear here with the most recent at the top.
   4. Global Libraries - Users can access global libraries from the FTC Parts Users Library WITHOUT being a member of the teams. This includes ServoCity, GoBilda, Andy Mark, ServoCity, and Rev Robotics.
   5. Recently Opened - Users can views their recently opened documents here. Note: this is the same as Onshape's recently opened section.
   6. Help/Instructions - The current page. Details instructions and help on Insert Tool app usage.

  - **Onshape Features**

      Users can navigate to documents and folders the same way as Onshape's home page.

    1. My Onshape
    2. Recently Opened
    3. Created by Me
    4. Shared with me
    5. Public

  - **Other**

    Users can navigate to other Onshape features like tutorials and samples. 


## Inserting Documents

  Users can insert documents to the active part studio or assembly by navigating to them and left-clicking them.

  **Configurable Documents**  
  When configurable documents are clicked, the user will be prompted with configuration options. When they fill out these settings and click the generated document, it will be inserted. 

## Breadcrumbs

  The breadcrumbs display the path from Home to the current location. Users can click on the crumbs to go to those locations.

## Action Menu

  Right-clicking on documents and folders will prompt an action menu.
  Users can use this menu to add/remove documents from their favorites and also report flaws with the Onshape document.

## Document History

  Users can view a document's history on a spreadsheet. Steps:

  Right-click a document (you must have permissions to view the versions), and click "Get Document Changes History" on the action menu. This will download a csv file.

  Copy [this spreadsheet](https://docs.google.com/spreadsheets/d/1sICcBFcN1jB91jdHT9r_C2cCdiWMSz4ZIUIpqvwDUNo/copy). First, click the "Data" tab in the bottom left corner. Then, go to "File --> "Import" --> "Upload", and import the csv file. When the import options appear, select the dropdown "Import Location", and click "Replace Current Sheet". Then click "Import data".

  Now, you can go to the "Display" tab and see the graph and hours each person has spent.

  The Activity Period controls whether changes are counted as consecutive. It reflects how long someone can think about or look at a model before making another change to it, to be considered working on it.

  For example, a change is made 2 minutes after the previous change. If the Activity Period is < 120, then the changes will count as consecutive. If the Activity Period is >= 120, then the change will not count as consecutive, so no minutes will be counted between the two changes.

  The Edges Control changes how many seconds are counted before the first change of a consecutive set of changes. It reflects how long someone can think about or look at a model before making changes to it, to be considered working on it.

  ---

# Issue Reporting

Users should report bugs or requests to the [Insert Tool github repository](https://github.com/Team2901/OnshapeInsertTool/issues/). Help requests should not be submitted here but instead emailed to inserttool@ftconshape.com or submitted to the [Insert Tool github discussions](https://github.com/Team2901/OnshapeInsertTool/discussions).

---
# Advanced


## Parts Libraries

Parts libraries are libraries of Onshape documents. Owners of the libraries can manage them by adding, removing, and moving documents and folders.

**Global Libraries** are libraries that Insert Tool app users to access and are managed by the Insert Tool app developers. These are simply public parts library documents whose ids are hardcoded into the Insert Tool app.


## Special Documents
  
- **Preferences**
  - This document appears as "⚙ Preferences ⚙" and stores user-specific information about the Insert Tool extension.


- **Parts Library Document**
  - This document appears as ⏍{library_name}⏍ for example ⏍Pitsco⏍ 
  - All information related to the parts library is stored in this file. The raw json data can be viewed by accessing the elements of the document.
- **Parts Library Raw Document**
  - This document appears as ⏍︴RAW DON'T RENAME︴{library_name} ⏍
  - This document is created when a parts library is created by cloning a folder. It is used for scanning the library delta.
  - This document is a parts library, but should not be edited.
  - Although few users will use this, it should not be deleted unless the library is also deleted.


- **Parts Library Difference**
  - This document appears as ⏍{library_name} Difference(You can delete)⏍
  - This document is a parts library and is created when the libraries delta is scanned. It contains the additions from the folder location of the library to the parts library.
  - This document can and should be deleted after manually transferring the additions it contains to the parts library.

