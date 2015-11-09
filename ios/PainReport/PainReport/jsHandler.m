//
//  jsHandler.m
//  PainReport
//
//  Created by HEAL ASU on 3/5/15.
//  Copyright (c) 2015 cnmc. All rights reserved.
//

#import "jsHandler.h"

@implementation jsHandler


-(void)getPinFromJS:(NSString*) pinFromJS{
    NSLog(@"PIN: %@ recieved from local storage",pinFromJS);
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setObject:pinFromJS forKey:@"PIN"];
    [defaults synchronize];
    NSLog(@"PIN: %@ set in NSUserDefaults",[defaults objectForKey:@"PIN"]);
}

@end
