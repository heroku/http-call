
[4;1mjsdoc-to-markdown[0m

  Generates markdown documentation from jsdoc-annotated source code. 

[4;1mSynopsis[0m

  $ jsdoc2md <jsdoc-options> [<dmd-options>] 
  $ jsdoc2md <jsdoc-options> [1m--jsdoc[0m         
  $ jsdoc2md <jsdoc-options> [1m--json[0m          
  $ jsdoc2md <jsdoc-options> [1m--namepaths[0m     
  $ jsdoc2md [1m--help[0m                          
  $ jsdoc2md [1m--config[0m                        

[4;1mGeneral options[0m

  Main options affecting mode. If none of the following are supplied, the tool  
  will generate markdown docs.                                                  

  [1m-h[0m, [1m--help[0m    Print usage information                                         
  [1m--config[0m      Print all options supplied (from command line, `.jsdoc2md.json` 
                or `package.json` under the `jsdoc2md` property) and exit.      
                Useful for checking the tool is receiving the correct config.   
  [1m--json[0m        Prints the data (jsdoc-parse output) supplied to the template   
                (dmd).                                                          
  [1m--jsdoc[0m       Prints the raw jsdoc data.                                      
  [1m--version[0m                                                                     
  [1m--no-cache[0m    By default, repeat invocations against the same input with the  
                same options returns from cache. This option disables that.     
  [1m--clear[0m       Clears the cache.                                               

[4;1mjsdoc options[0m

  Options regarding the input source code, passed directly to jsdoc. 

  [1m-f[0m, [1m--files[0m [4mfile[0m ...   A list of jsdoc explain files (or glob expressions) to 
                         parse for documentation. Either this or [1m--source[0m must  
                         be supplied.                                           
  [1m--source[0m [4mstring[0m        A string containing source code to parse for           
                         documentation. Either this or [1m--files[0m must be          
                         supplied.                                              
  [1m-c[0m, [1m--configure[0m [4mfile[0m   Path to a jsdoc configuration file, passed directly to 
                         `jsdoc -c`.                                            
  [1m--html[0m                 Enable experimental parsing of .html files. When       
                         specified, any configuration supplied via [1m--configure[0m  
                         is ignored.                                            
  [1m--namepaths[0m            Print namepaths.                                       

[4;1mdmd[0m

  These options affect how the markdown output looks. 

  [1m-t[0m, [1m--template[0m <file>               A custom handlebars template file to      
                                      insert documentation into. The default    
                                      template is `{{>main}}`.                  
  [1m--private[0m                           Include identifiers marked [1m@private[0m in    
                                      the output                                
  [1m-d[0m, [1m--heading-depth[0m [4mnumber[0m          Root markdown heading depth, defaults to  
                                      2 ([1m##[0m).                                   
  [1m--plugin[0m [4mmodule[0m ...                 Use an installed package containing       
                                      helper and/or partial overrides.          
  [1m--helper[0m [4mmodule[0m ...                 Handlebars helper modules to override or  
                                      extend the default set.                   
  [1m--partial[0m [4mfile[0m ...                  Handlebars partial files to override or   
                                      extend the default set.                   
  [1m-l[0m, [1m--example-lang[0m [4mstring[0m           Specifies the default language used in    
                                      [1m@example[0m blocks (for syntax-highlighting  
                                      purposes). In the default gfm mode, each  
                                      [1m@example[0m is wrapped in a fenced-code      
                                      block. Example usage: [1m--example-lang js[0m.  
                                      Use the special value [1mnone[0m for no         
                                      specific language. While using this       
                                      option, you can override the supplied     
                                      language for any [1m@example[0m by specifying   
                                      the [1m@lang[0m subtag, e.g [1m@example @lang hbs[0m. 
                                      Specifying [1m@example @lang off[0m will        
                                      disable code blocks for that example.     
  [1m--name-format[0m                       Format identifier names as code           
  [1m--no-gfm[0m                            By default, dmd generates github-         
                                      flavoured markdown. Not all markdown      
                                      parsers render gfm correctly. If your     
                                      generated docs look incorrect on sites    
                                      other than Github (e.g. npmjs.org) try    
                                      enabling this option to disable Github-   
                                      specific syntax.                          
  [1m--separators[0m                        Put [1m<hr>[0m breaks between identifiers.      
                                      Improves readability on bulky docs.       
  [1m-m[0m, [1m--module-index-format[0m [4mstring[0m    When muliple modules are found in the     
                                      input source code, an index is generated. 
                                      It can be styled by one of the following  
                                      options: [1mnone[0m, [1mgrouped[0m, [1mtable[0m or [1mdl[0m.      
  [1m-g[0m, [1m--global-index-format[0m [4mstring[0m    When muliple global-scope identifiers are 
                                      found in the input source code, an index  
                                      is generated. It can be styled by one of  
                                      the following options: [1mnone[0m, [1mgrouped[0m,     
                                      [1mtable[0m or [1mdl[0m.                              
  [1m-p[0m, [1m--param-list-format[0m [4mstring[0m      Two options to render [1m@param[0m lists: [1mlist[0m  
                                      or [1mtable[0m (default). Table format works    
                                      well in most cases but switch to [1mlist[0m if  
                                      things begin to look crowded.             
  [1m-r[0m, [1m--property-list-format[0m [4mstring[0m   Two options to render [1m@property[0m lists:    
                                      [1mlist[0m or [1mtable[0m (default).                  
  [1m--member-index-format[0m [4mstring[0m        Two options to render member lists: [1mlist[0m  
                                      or [1mgrouped[0m (default). The [1mlist[0m view is    
                                      loosely-based on the nodejs docs.         

  Project repository:   [4mhttps://github.com/jsdoc2md/jsdoc-to-markdown[0m 

