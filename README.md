# VSCode Extension: Flutter Extract Widget to File

As a Flutter developer, it's very common to refactor widgets into new files. The extension allows you to extract a selection of code into a stateless widget class, handling the import and file creation. This allows for smooth extraction without the need for a mouse.

Here is a simple Widget extraction:

![alt text](https://media.giphy.com/media/N42B2VfGatYQOQLeiF/source.gif)


Here is another Widget extraction with properties specified:

![alt text](https://media.giphy.com/media/dKBYfFAick2uKVyYtN/source.gif)


## Usage

1. Open the Dart file you want to work with in your Flutter project.
2. Select the Widget you want to convert into a new StatelessWidget.
3. Right-click the selected text and choose "Extract Flutter Widget to File" or click "Cmd+alt+E".
4. In the prompt that opens, enter the path relative to "lib", like "components/tiles/MyWidget", the "MyWidget" will be camelcase, the extension will create directory at "lib/components/tiles" and a file "my_widget.dart" under it
5. if you like, you could specfic the properties after ";" to create fields with newly created file
6. In current file, the "import $packageName/components/tiles/my_widget.dart" would be append to imports statements
7. the selecvtion of wiget will replaced with MyWidget() with properties


## Example

Below is an example of how to use the extension by selecting a Container Widget and converting it into a new StatelessWidget class named "MyNewWidget":

**main.dart (before)**
```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('My App')),
         body: ListView.builder(
          itemBuilder: (context, index) {
            final song = songs[index];
            return ListTile(
              title: Text(song.name),
              subtitle: Text(song.artistName),
              leading: CircleAvatar(
                backgroundImage: AssetImage(song.coverPath),
              ),
              trailing: Icon(Icons.delete),
              onTap: () => goToSongPage(index),
            );
          },
          itemCount: songs.length,
        ),
      ),     
    );
  }
}
```

press `Cmd+Atl+E`, in the prompt box, typing: `components/tiles/MyTile;Song song,void Function()? onTap`, will generate:

**main.dart (after)**
```dart
import 'package:flutter/material.dart';
import "package:hello_world_app/components/tiles/my_tile.dart"; //this will automatically inserted

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('My App')),
        body: ListView.builder(
         itemBuilder: (context, index) {
            final song = songs[index];
            return MyTile(
              song: null, //Here just assgin variable
              onTap: null, //Here assign the handler
            );
          },
          itemCount: songs.length,
        ),
      ),     
    );
  }
}
```



**lib/components/tiles/my_tile.dart**
```dart
import 'package:flutter/material.dart';
import 'package:hello_world_app/models/song.dart';

class MyTile extends StatelessWidget {
  final Song song;
  final void Function()? onTap;

  const MyTile({super.key, required this.song, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(song.name),
      subtitle: Text(song.artistName),
      leading: CircleAvatar(
        backgroundImage: AssetImage(song.coverPath),
      ),
      trailing: Icon(Icons.delete),
      onTap: onTap,
    );
  }
}

```


Inspired by [Flutter Extract Widget and Create Part](https://github.com/alper-mf/vscode_flutter_extract_widget_create_part) and [VSCode Advanced New File](https://github.com/patbenatar/vscode-advanced-new-file/tree/master?tab=readme-ov-file#vscode-advanced-new-file).



[publisher](https://marketplace.visualstudio.com/manage/publishers/tuohuang)